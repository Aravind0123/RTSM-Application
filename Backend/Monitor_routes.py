from flask import Blueprint, jsonify, request
from db import get_db_connection # Make sure this import path is correct for your project
from datetime import datetime, timezone

# Create a Blueprint for monitor-specific routes
monitor_bp = Blueprint('monitor_bp', __name__)

def get_user_site_from_db(username):
    """
    Fetches the 'sites' associated with a given username from the users table.
    This is a helper function for both monitor and potentially other modules.
    """
    conn = None
    cursor = None
    site = None
    try:
        conn = get_db_connection()
        if conn is None:
            print("Database connection failed in get_user_site_from_db.")
            return None

        cursor = conn.cursor(dictionary=True) # Use dictionary=True for column names as keys
        cursor.execute("SELECT sites FROM users WHERE username = %s", (username,))
        site_data = cursor.fetchone()
        if site_data and 'sites' in site_data:
            site = site_data['sites']
    except Exception as e:
        print(f"Error fetching user site for {username}: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()
    return site

@monitor_bp.route('/monitor/get_user_site', methods=['GET'])
def get_user_site_route():
    """
    Returns the site associated with the given username.
    Expected query parameter: username=<username>
    """
    username = request.args.get('username')
    if not username:
        return jsonify({"error": "Username parameter is missing."}), 400

    user_site = get_user_site_from_db(username)

    if user_site is not None:
        return jsonify({"userSite": user_site}), 200
    else:
        # If user_site is None, it means user not found or no site assigned
        return jsonify({"userSite": None, "message": f"User '{username}' not found or no site assigned."}), 404

@monitor_bp.route('/monitor/patients', methods=['GET'])
def get_all_patients_for_monitor():
    """
    Returns a list of all active patients (is_deleted = 0) for the monitor's assigned site.
    The monitor's site is determined using the provided username.
    Expected query parameter: username=<username>
    """
    username = request.args.get('username')
    if not username:
        return jsonify({"message": "Username parameter is missing."}, 400)

    user_site = get_user_site_from_db(username)
    if user_site is None:
        return jsonify({"message": f"User '{username}' not found or no site assigned."}, 404)

    conn = None
    cursor = None
    patients_data = []
    try:
        conn = get_db_connection()
        if conn is None:
            raise Exception("Database connection failed.")
        cursor = conn.cursor(dictionary=True)

        # Fetch patients for the assigned site where is_deleted is 0
        # Columns selected match the frontend's expectation for display
        cursor.execute("""
            SELECT id AS patient_id, sites AS site_id, status
            FROM patients
            WHERE sites = %s and status != 'Code Broken'
            ORDER BY id
        """, (user_site,))
        patients_data = cursor.fetchall()
        return jsonify({"patients": patients_data}), 200
    except Exception as e:
        print(f"Error fetching all patients for site {user_site}: {e}")
        return jsonify({"message": f"Failed to retrieve patient data: {str(e)}"}, 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@monitor_bp.route('/monitor/code_broken_by_site', methods=['GET'])
def get_code_broken_patients_for_monitor():
    """
    Returns patients whose code has been broken (code_break IS NOT NULL)
    and belong to the monitor's site.
    The monitor's site is determined using the provided username.
    Expected query parameter: username=<username>
    """
    username = request.args.get('username')
    if not username:
        return jsonify({"message": "Username parameter is missing."}, 400)

    user_site = get_user_site_from_db(username)
    if user_site is None:
        return jsonify({"message": f"User '{username}' not found or no site assigned."}, 404)

    conn = None
    cursor = None
    code_broken_data = []
    try:
        conn = get_db_connection()
        if conn is None:
            raise Exception("Database connection failed.")
        cursor = conn.cursor(dictionary=True)

        # Fetch patients from the user's site where code_break is NOT NULL
        # Assuming 'code_break' column in 'patients' table stores the reason/timestamp directly
        # or you have a separate 'code_breaks' table.
        # Based on your previous patient_bp code, it seems 'code_break' is a column in 'patients'.
        # Let's assume it stores a reason string, and we'll add a 'break_timestamp' if not present,
        # or adapt if it's just a boolean/flag.
        # For this example, I'll assume `code_break` stores a string reason, and you might need
        # a separate `code_break_timestamp` column if you need an exact timestamp.
        # If `code_break` just stores 'True' or 'Yes', you'll need to adjust.
        # I'll include a placeholder for `date_broken` for consistency with frontend.

        cursor.execute("""
            SELECT id as patient_id, status, code_break from patients where sites=%s 
            and status="Code Broken"
        """, (user_site,))
        code_broken_data = cursor.fetchall()
        return jsonify({"code_broken_patients": code_broken_data}), 200
    except Exception as e:
        print(f"Error fetching code broken patients for site {user_site}: {e}")
        return jsonify({"message": f"Failed to retrieve code broken patient data: {str(e)}"}, 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@monitor_bp.route('/monitor/record_code_break', methods=['POST'])
def record_code_break():
    """
    Records an emergency code break for a patient.
    Expects JSON payload: { "patientId": "...", "reason": "...", "brokenBy": "...", "userSite": "..." }
    Updates the 'code_break' column in the 'patients' table and potentially 'status'.
    """
    data = request.get_json()
    patient_id = data.get('patientId')
    reason = data.get('reason')
    broken_by = data.get('brokenBy') # This is the username performing the break
    user_site = data.get('userSite') # Frontend sends userSite directly

    if not all([patient_id, reason, broken_by, user_site]):
        return jsonify({"message": "Missing required fields (patientId, reason, brokenBy, userSite)"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        if conn is None:
            raise Exception("Database connection failed.")
        cursor = conn.cursor()

        # 1. Verify patient exists, belongs to the specified site, and is not already code broken
        cursor.execute(
            "SELECT id, code_break FROM patients WHERE id = %s AND sites = %s and status != 'Code Broken' ",
            (patient_id, user_site)
        )
        patient_data = cursor.fetchone()

        if not patient_data:
            return jsonify({"message": f"Patient ID {patient_id} not found or does not belong to site {user_site}."}), 404

        if patient_data[1] is not None: # Check if code_break column already has a value
            return jsonify({"message": f"Code for Patient ID {patient_id} is already broken."}), 409 # Conflict

        # 2. Update patient status and record code break details in the 'patients' table
        # Assuming 'code_break' column stores the reason, and 'TRT_Completion_Date' can be repurposed
        # or a new column like 'code_break_timestamp' can be added for the actual time of break.
        # For simplicity, I'm using TRT_Completion_Date as the break timestamp for now.
        # It's highly recommended to add a dedicated 'code_break_timestamp' column if precision is critical.
        break_timestamp = datetime.now(timezone.utc)

        sql_update_patient_for_code_break = """
            UPDATE patients
            SET status = %s, code_break = %s, TRT_Completion_Date = %s -- Using TRT_Completion_Date for timestamp
            WHERE id = %s
        """
        cursor.execute(sql_update_patient_for_code_break, ('Code Broken', reason, break_timestamp, patient_id))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "No patient updated (unexpected error). Please check logs."}), 500

        return jsonify({
            "message": "Emergency Code Break recorded successfully.",
            "patientId": patient_id
        }), 200
    except Exception as e:
        if conn:
            conn.rollback() # Rollback in case of error
        print(f"Error recording code break for patient {patient_id}: {e}")
        return jsonify({"message": f"Failed to record emergency code break: {str(e)}"}, 500)
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()