import random
from flask import Blueprint, request, jsonify
import uuid # For generating unique patient IDs
from db import get_db_connection # Import from the new db.py file

patient_rd = Blueprint('randomisation',__name__)

@patient_rd.route('/patients/enrolled', methods=['GET'])
def get_enrolled_patients():
    """
    Returns a list of patients with 'Enrolled' status who are not yet randomized.
    Optionally filtered by the 'sites' associated with the provided username.
    Username is expected as a query parameter: /patients/enrolled?username=<username>
    """
    username = request.args.get('username')
    conn = get_db_connection()
    if conn is None:
        return jsonify({"patients": []}), 500

    cursor = conn.cursor(dictionary=True)
    site = None

    try:
        if username:
            cursor.execute("SELECT sites FROM users WHERE username = %s", (username,))
            site_data = cursor.fetchone()
            if site_data and site_data['sites']:
                site = site_data['sites']
            else:
                print(f"Warning: User '{username}' not found or has no associated site for enrolled patients.")
                return jsonify({"patients": []}), 200

        if site:
            query = "SELECT id, patient_name FROM patients WHERE status = 'Enrolled' AND assigned_pack_id IS NULL AND sites = %s"
            cursor.execute(query, (site,))
        else:
            return jsonify({f"error" : "No data Found"}),200

        enrolled_patients = cursor.fetchall()
        return jsonify({"enrolled_patients": enrolled_patients})

    except Exception as e:
        print(f"Error fetching enrolled patients: {e}")
        return jsonify({"error": "Failed to fetch enrolled patients", "details": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@patient_rd.route('/packs/available', methods=['GET'])
def get_available_packs():
    """
    Returns a list of packs with 'Available' status.
    """
    conn = get_db_connection()
    if conn is None:
        return jsonify({"packs": []}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT pack_number, pack_type FROM packs WHERE status = 'A'")
        available_packs = cursor.fetchall()
        return jsonify({"available_packs": available_packs})
    
    except Exception as e:
        print(f"Error fetching available packs: {e}")
        return jsonify({"error": "Failed to fetch available packs", "details": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@patient_rd.route('/randomize_patient', methods=['POST'])
def randomize_patient():
    """
    Randomizes an enrolled patient to an available pack.
    Expects JSON: { "patientId": "..." }
    """
    data = request.get_json()
    patient_id = data.get('patientId')
    username = data.get('username')
    

    if not patient_id:
        return jsonify({"error": "Missing patient ID"}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    if username:
        cursor.execute("SELECT sites FROM users WHERE username = %s", (username,))
        site_data = cursor.fetchone()
        if site_data and site_data[0]:
            site = site_data[0]
        else:
            print(f"Warning: User '{username}' not found or has no associated site for enrolled patients.")
            return jsonify({"patients": []}), 200

    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    try:
        # 1. Check if patient exists and is 'Enrolled' and not yet randomized
        cursor.execute("SELECT status, assigned_pack_id FROM patients WHERE id = %s and sites =%s and status='Enrolled' ", (patient_id,site,))
        patient_data = cursor.fetchone()

        if not patient_data:
            return jsonify({"message": "Patient not found"}), 404
        if patient_data[0] != 'Enrolled': # patient_data[0] is status
            return jsonify({"message": "Patient is not in 'Enrolled' status and cannot be randomized"}), 400
        if patient_data[1] is not None: # patient_data[1] is assigned_pack_id
            return jsonify({"message": "Patient is already randomized"}), 400

        # 2. Get available packs
        cursor.execute("SELECT pack_number FROM packs WHERE status = 'A' and centre =%s",(site,))
        available_packs = cursor.fetchall() # Returns list of tuples, e.g., [('PACK001',), ('PACK002',)]

        if not available_packs:
            return jsonify({"message": "No available packs for randomization"}), 401

        # Select a random pack
        random_pack_tuple = random.choice(available_packs)
        random_pack_id = random_pack_tuple[0] # Extract the string from the tuple

        # 3. Update patient status to 'Randomized' and assign pack_id
        update_patient_query = """
        UPDATE patients
        SET status = %s, assigned_pack_id = %s, treatment = %s
        WHERE id = %s
        """
        # Assuming treatment type is based on pack_type, you might fetch pack_type here
        # For simplicity, let's just set treatment to 'Assigned Pack' or similar
        cursor.execute(update_patient_query, ('Randomized', random_pack_id, 'Assigned Pack', patient_id))

        # 4. Update pack status to 'Allocated'
        update_pack_query = """
        UPDATE packs
        SET status = %s
        WHERE pack_number= %s
        """
        cursor.execute(update_pack_query, ('Allocated', random_pack_id))

        conn.commit()

        return jsonify({
            "message": "Patient randomized successfully",
            "patient_id": patient_id,
            "assigned_pack_id": random_pack_id,
            "new_status": "Randomized"
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error during patient randomization: {e}")
        return jsonify({"message": "Failed to randomize patient", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
