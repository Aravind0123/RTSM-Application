from flask import Blueprint, request, jsonify
from db import get_db_connection 

patient_ecb = Blueprint("EmergencyCodeBreak",__name__)
@patient_ecb.route('/patients/not_code_broken', methods=['GET'])
def get_patients_not_code_broken():
    """
    Returns a list of patients who are not yet 'Code Broken' and have not completed treatment.
    Optionally filtered by the 'sites' associated with the provided username.
    Username is expected as a query parameter: /patients/not_code_broken?username=<username>
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
                print(f"Warning: User '{username}' not found or has no associated site for code break eligibility.")
                return jsonify({"patients": []}), 200

        if site:
            query = "SELECT id, patient_name FROM patients WHERE status != 'Code Broken' AND TRT_completion_date IS NULL AND Code_break IS NULL AND sites = %s"
            cursor.execute(query, (site,))
        else:
            query = "SELECT id, patient_name FROM patients WHERE status != 'Code Broken' AND TRT_completion_date IS NULL AND Code_breakIS NULL"
            cursor.execute(query)

        eligible_patients = cursor.fetchall()
        return jsonify({"eligible_patients": eligible_patients})

    except Exception as e:
        print(f"Error fetching eligible patients for code break: {e}")
        return jsonify({"error": "Failed to fetch eligible patients for code break", "details": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@patient_ecb.route('/record_code_break', methods=['POST'])
def record_code_break():
    """
    Records an emergency code break for a patient.
    Expects JSON: { "patientId": "...", "codeBreakDate": "..." }
    """
    data = request.get_json()
    patient_id = data.get('patientId')
    Code_break= data.get('codeBreakDate')

    if not all([patient_id, Code_break]):
        return jsonify({"error": "Missing patient ID or code break date"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        # 1. Check if patient exists and is not already code broken
        cursor.execute("SELECT status, Code_break FROM patients WHERE id = %s", (patient_id,))
        patient_data = cursor.fetchone()

        print(patient_data)
        if not patient_data:
            return jsonify({"message": "Patient not found"}), 404
        if patient_data[0] == 'Code Broken' or patient_data[1] is not None:
            return jsonify({"message": "Patient is already code broken"}), 400

        # 2. Update patient status to 'Code Broken' and set code_break_date
        update_query = """
        UPDATE patients
        SET status = %s, Code_break= %s
        WHERE id = %s
        """
        print("error after update")
        cursor.execute(update_query, ('Code Broken', Code_break, patient_id,))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "No patient updated (might be already code broken or ID mismatch)"}), 200

        return jsonify({
            "message": "Emergency code break recorded successfully",
            "patient_id": patient_id,
            "new_status": "Code Broken"
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error recording emergency code break: {e}")
        return jsonify({"message": "Failed to record emergency code break", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
