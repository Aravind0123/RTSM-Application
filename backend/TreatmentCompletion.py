from flask import Blueprint, request, jsonify
from db import get_db_connection

patient_tc = Blueprint('treatmentcom',__name__)
@patient_tc.route('/patients/randomized_for_completion', methods=['GET'])
def get_randomized_patients_for_completion():
    """
    Returns a list of patients with 'Randomized' status who have an assigned pack
    and have not yet completed treatment.
    Optionally filtered by the 'sites' associated with the provided username.
    Username is expected as a query parameter: /patients/randomized_for_completion?username=<username>
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
                print(f"Warning: User '{username}' not found or has no associated site for treatment completion.")
                return jsonify({"patients": []}), 200

        if site:
            query = "SELECT id, patient_name FROM patients WHERE status = 'Randomized' AND assigned_pack_id IS NOT NULL AND TRT_Completion_Date IS NULL AND sites = %s"
            cursor.execute(query, (site,))
        else:
            query = "SELECT id, patient_name FROM patients WHERE status = 'Randomized' AND assigned_pack_id IS NOT NULL AND TRT_TRT_Completion_Date IS NULL"
            cursor.execute(query)

        eligible_patients = cursor.fetchall()
        return jsonify({"eligible_patients": eligible_patients})

    except Exception as e:
        print(f"Error fetching eligible patients for treatment completion: {e}")
        return jsonify({"error": "Failed to fetch eligible patients", "details": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@patient_tc.route('/complete_treatment', methods=['POST'])
def complete_treatment():
    """
    Records treatment completion for a randomized patient.
    Expects JSON: { "patientId": "...", "completionDate": "..." }
    """
    data = request.get_json()
    patient_id = data.get('patientId')
    TRT_Completion_Date = data.get('completionDate')

    if not all([patient_id, TRT_Completion_Date]):
        return jsonify({"error": "Missing patient ID or completion date"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        # 1. Check if patient exists and is 'Randomized' and has an assigned pack
        cursor.execute("SELECT status, assigned_pack_id, TRT_Completion_Date FROM patients WHERE id = %s", (patient_id,))
        patient_data = cursor.fetchone()

        if not patient_data:
            return jsonify({"message": "Patient not found"}), 404
        if patient_data[0] != 'Randomized' or patient_data[1] is None:
            return jsonify({"message": "Patient is not in 'Randomized' status or has no assigned pack"}), 400
        if patient_data[2] is not None: # patient_data[2] is TRT_Completion_Date
            return jsonify({"message": "Treatment already completed for this patient"}), 400

        # 2. Update patient status to 'Treatment Completed' and set TRT_Completion_Date
        update_query = """
        UPDATE patients
        SET status = %s, TRT_Completion_Date = %s
        WHERE id = %s
        """
        cursor.execute(update_query, ('Treatment Completed', TRT_Completion_Date, patient_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "No patient updated (might be already completed or ID mismatch)"}), 200

        return jsonify({
            "message": "Treatment completion recorded successfully",
            "patient_id": patient_id,
            "new_status": "Treatment Completed"
        }), 200

    except Exception as e:
        conn.rollback()
        print(f"Error recording treatment completion: {e}")
        return jsonify({"message": "Failed to record treatment completion", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()