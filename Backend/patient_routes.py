from flask import Blueprint, request, jsonify
import uuid # For generating unique patient IDs
from db import get_db_connection # Import from the new db.py file
from datetime import datetime, timezone # For accurate timestamps

# Create a Blueprint for patient-related routes
patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/patients', methods=['GET'])
def get_patients():
    """
    Returns a list of all registered patients from the database,
    optionally filtered by the 'sites' associated with the provided username.
    Only active (is_deleted = 0) patients are returned.
    Username is expected as a query parameter: /patients?username=<username>
    """
    username = request.args.get('username')

    conn = get_db_connection()
    if conn is None:
        print("Error: Database connection failed in get_patients.")
        return jsonify({"patients": [], "message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    user_site = None # Initialize user_site to None

    try:
        if username:
            # Fetch the site associated with the username from the users table
            # Use a separate cursor if needed or ensure the current one doesn't interfere
            site_cursor = conn.cursor(dictionary=True)
            site_cursor.execute("SELECT sites FROM users WHERE username = %s", (username,))
            site_data = site_cursor.fetchone()
            site_cursor.close() # Close this cursor immediately

            if site_data and site_data['sites']:
                user_site = site_data['sites']
            else:
                print(f"Warning: User '{username}' not found or has no associated site.")
                # For a general 'get_patients' endpoint, returning an empty list for no site might be acceptable
                # or you could return a 404 if you strictly require a site.
                return jsonify({"patients": [], "message": f"User '{username}' not found or has no associated site."}), 200

        # Base query to select all necessary patient fields and filter by is_deleted = 0
        base_query = """
        SELECT id, patient_name, status, enrollment_date, informed_consent_date, 
               date_of_birth, gender, treatment, screen_failure_date, sites,
               assigned_pack_id, TRT_Completion_Date, code_break 
        FROM patients where sites = %s
        """
        cursor.execute(base_query,(user_site,))
        patients = cursor.fetchall()
        return jsonify({"patients": patients}), 200

    except Exception as e:
        print(f"Error fetching patient data in get_patients: {e}")
        return jsonify({"error": "Failed to fetch patient data", "details": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@patient_bp.route('/register_patient', methods=['POST'])
def register_patient():
    """
    Registers a new patient with automatically generated ID and stores in MySQL.
    Expects JSON data with informedConsentDate, enrollmentDate, dateOfBirth, gender, and the username of the registering user.
    """
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400
    required_fields = ['informedConsentDate', 'enrollmentDate', 'dateOfBirth', 'gender', 'username']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    conn = get_db_connection()
    if conn is None:
        print("Error: Database connection failed in register_patient.")
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        # --- Get the site of the registering user ---
        registering_username = data.get('username')
        user_site = None
        user_cursor = conn.cursor(dictionary=True)
        user_cursor.execute("SELECT sites FROM users WHERE username = %s", (registering_username,))
        user_site_data = user_cursor.fetchone()
        if user_site_data and user_site_data['sites']:
            user_site = user_site_data['sites']
        user_cursor.close()

        if not user_site:
            return jsonify({"error": f"Registering user '{registering_username}' not found or has no associated site."}), 400
        # --- End Get site ---

        # Generate Unique patient ID (e.g., PAT001, PAT002...)
        # This assumes 'id' column stores 'PAT' followed by a number.
        # It's safer to query MAX(id) directly and handle string parsing in Python.
        cursor.execute("SELECT id FROM patients ORDER BY id DESC LIMIT 1")
        last_patient_id = cursor.fetchone()
        
        if last_patient_id:
            # Extract number part, convert to int, increment, then re-pad
            last_id_num = int(last_patient_id[0][3:]) # Assuming format PATXXX
            new_id_num = last_id_num + 1
            new_patient_id = f"PAT{new_id_num:03d}" # Pad with leading zeros to 3 digits
        else:
            new_patient_id = "PAT001" # First patient

        # Generate Unique patient Name (e.g., SITE_CODE_001, SITE_CODE_002)
        # This logic needs to be careful to get the max based on the current site
        cursor.execute("SELECT patient_name FROM patients WHERE sites = %s ORDER BY patient_name DESC LIMIT 1", (user_site,))
        last_patient_name_for_site = cursor.fetchone()

        if last_patient_name_for_site:
            # Example: Assuming patient_name is like "SITE5001001", extract the number part after site code
            try:
                # Find the index where the site code ends and the number begins
                num_part_start_index = len(user_site)
                last_name_num = int(last_patient_name_for_site[0][num_part_start_index:])
                new_name_num = last_name_num + 1
                new_patient_name = f"{user_site}{new_name_num:03d}" # Pad with leading zeros to 3 digits
            except ValueError:
                # Fallback if parsing fails (e.g., inconsistent naming convention)
                print(f"Warning: Could not parse last patient name for site {user_site}: {last_patient_name_for_site[0]}. Generating unique name with UUID.")
                new_patient_name = f"{user_site}-{str(uuid.uuid4())[:8]}" # Use UUID fallback
        else:
            new_patient_name = f"{user_site}001" # First patient for this site

        # Extract data from request
        informed_consent_date = data.get('informedConsentDate')
        enrollment_date = data.get('enrollmentDate')
        date_of_birth = data.get('dateOfBirth')
        gender = data.get('gender')
        status = "Enrolled" # Default status upon enrollment
        treatment = "Pending" # Initial treatment status
        screen_failure_date = None # Initialize as None for new enrollments

        # Insert new patient into the patients table, including the 'sites' column
        insert_query = """
        INSERT INTO patients (
            id, patient_name, status, enrollment_date,
            informed_consent_date, date_of_birth, gender, treatment, screen_failure_date, sites
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (
            new_patient_id, new_patient_name, status, enrollment_date,
            informed_consent_date, date_of_birth, gender, treatment, screen_failure_date, user_site
        ))
        conn.commit()

        return jsonify({
            "message": "Patient registered successfully",
            "patient_id": new_patient_id,
            "patient_details": {
                "id": new_patient_id,
                "patient_name": new_patient_name,
                "status": status,
                "enrollment_date": enrollment_date,
                "informed_consent_date": informed_consent_date,
                "date_of_birth": date_of_birth,
                "gender": gender,
                "treatment": treatment,
                "screen_failure_date": screen_failure_date,
                "sites": user_site
            }
        }), 201

    except Exception as e:
        conn.rollback()
        print(f"Error during patient registration: {e}")
        return jsonify({"message": "Patient registration failed", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@patient_bp.route('/record_screen_failure', methods=['POST'])
def record_screen_failure():
    """
    Records a screen failure for an existing patient.
    Expects JSON data with patientId, username, and screenFailureDate.
    Updates the patient's status and screen_failure_date in the database.
    Verifies the patient belongs to the user's site.
    """
    data = request.get_json()
    print(f"Received data for screen failure: {data}") # Log incoming data for debugging

    patient_id = data.get('patientId')
    username = data.get('username')
    screen_failure_date = data.get('screenFailureDate')

    if not all([patient_id, username, screen_failure_date]):
        return jsonify({"error": "Missing patient ID, username, or screen failure date"}), 400

    conn = get_db_connection()
    if conn is None:
        print("Error: Database connection failed in record_screen_failure.")
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        # Get the site of the user performing the action
        user_cursor = conn.cursor(dictionary=True)
        user_cursor.execute("SELECT sites FROM users WHERE username = %s", (username,))
        site_data = user_cursor.fetchone()
        user_cursor.close()

        if not site_data or not site_data['sites']:
            return jsonify({"message": f"User '{username}' not found or has no associated site."}), 401

        user_site = site_data['sites']

        # Check if patient exists, belongs to the user's site, and is currently 'Enrolled'
        cursor.execute(
            "SELECT id FROM patients WHERE id = %s AND sites = %s AND status = 'Enrolled' ",
            (patient_id, user_site)
        )
        existing_patient = cursor.fetchone()

        if not existing_patient:
            # Check for other statuses to give more specific feedback
            cursor.execute(
                "SELECT status FROM patients WHERE id = %s AND sites = %s AND is_deleted = 0",
                (patient_id, user_site)
            )
            current_status_data = cursor.fetchone()
            if current_status_data:
                current_status = current_status_data[0]
                if current_status == 'Screen Failure':
                    return jsonify({"message": "Patient is already marked as screen failure."}), 409 # Conflict
                else:
                    return jsonify({"message": f"Patient exists but has status '{current_status}'. Cannot record screen failure."}), 409
            else:
                return jsonify({"message": "Patient not found or does not belong to your site."}), 404

        # Update patient status and screen_failure_date
        update_query = """
        UPDATE patients
        SET status = %s, screen_failure_date = %s
        WHERE id = %s
        """
        cursor.execute(update_query, ('Screen Failure', screen_failure_date, patient_id))
        conn.commit()

        if cursor.rowcount == 0:
            # This should ideally not happen if existing_patient check passed, but good for robustness
            return jsonify({"message": "No patient updated (unexpected error). Please check logs."}), 500

        return jsonify({"message": "Screen failure recorded successfully", "patient_id": patient_id}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error recording screen failure for patient {patient_id}: {e}")
        return jsonify({"message": "Failed to record screen failure", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@patient_bp.route('/code_not_broken', methods=['GET'])
def get_patients_code_not_broken():
    """
    Fetches patients whose code has NOT been broken (code_break IS NULL)
    and belong to the monitor's site.
    The monitor's site is determined using the provided username.
    Expected query parameter: username=<username>
    """

    username = request.args.get('username')
    if not username:
        return jsonify({"message": "Username parameter is missing."}), 400

    conn = get_db_connection()
    if conn is None:
        print("Error: Database connection failed in get_patients_code_not_broken.")
        return jsonify({"patients": [], "message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    user_site = None

    try:
        # Get the user's site
        site_cursor = conn.cursor(dictionary=True)
        site_cursor.execute("SELECT sites FROM users WHERE username = %s", (username,))
        site_data = site_cursor.fetchone()
        site_cursor.close()

        if site_data and site_data[0]:
            user_site = site_data[0]
        else:
            print(f"Warning: User '{username}' not found or has no associated site for code_not_broken.")
            return jsonify({"patients": [], "message": f"User '{username}' not found or has no associated site."}), 200

        # Fetch patients from the user's site where code_break is NULL and not deleted
        query = """
        SELECT id, patient_name, status, enrollment_date, informed_consent_date,
               date_of_birth, gender, treatment, screen_failure_date, sites,
               assigned_pack_id, TRT_Completion_Date, code_break
        FROM patients
        WHERE sites = %s AND code_break IS NULL
        """
        cursor.execute(query, (user_site,))
        patients = cursor.fetchall()

        return jsonify({"patients": patients}), 200
    except Exception as e:
        print(f"Error fetching code not broken patients for site {user_site}: {e}")
        return jsonify({"error": "Failed to fetch patients with unbroken code", "details": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# New endpoint to get all sites
@patient_bp.route('/sites', methods=['GET'])
def get_all_sites():
    """
    Returns a list of all available sites from the 'sites' table.
    """
    conn = get_db_connection()
    if conn is None:
        print("Error: Database connection failed in get_all_sites.")
        return jsonify({"sites": [], "message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT sites, site_name, site_activation_date FROM sites")
        sites = cursor.fetchall()
        return jsonify({"sites": sites}), 200
    except Exception as e:
        print(f"Error fetching sites: {e}")
        return jsonify({"error": "Failed to fetch site data", "details": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# New endpoint to update user's associated site
@patient_bp.route('/update_user_site', methods=['POST'])
def update_user_site():
    """
    Updates the 'sites' column for a specific user in the 'users' table.
    Expects JSON data with 'username' and 'site'.
    """
    data = request.get_json()
    username = data.get('username')
    site = data.get('site')

    if not all([username, site]):
        return jsonify({"error": "Missing username or site"}), 400

    conn = get_db_connection()
    if conn is None:
        print("Error: Database connection failed in update_user_site.")
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        update_query = "UPDATE users SET sites = %s WHERE username = %s"
        cursor.execute(update_query, (site, username))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "User not found or site already set"}), 404
        else:
            return jsonify({"message": f"User '{username}' site updated to '{site}' successfully"}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error updating user site: {e}")
        return jsonify({"message": "Failed to update user site", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()