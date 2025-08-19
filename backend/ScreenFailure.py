from flask import Blueprint, request, jsonify
from db import get_db_connection

patient_sf = Blueprint('pat', __name__)

@patient_sf.route('/record_screen_failure', methods=['POST'])
def record_screen_failure():
    """
    Records a screen failure for an existing patient.
    Expects JSON data with patientId and screenFailureDate.
    Updates the patient's status and screen_failure_date in the database.
    """
    data = request.get_json()
    patient_id = data.get('patientId')
    screen_failure_date = data.get('screenFailureDate')

    if not all([patient_id, screen_failure_date]):
        return jsonify({"error": "Missing patient ID or screen failure date"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        # Check if patient exists
        cursor.execute("SELECT id FROM patients WHERE id = %s", (patient_id,))
        existing_patient = cursor.fetchone()
        if not existing_patient:
            return jsonify({"message": "Patient not found"}), 404

        # Update patient status and screen_failure_date
        update_query = """
        UPDATE patients
        SET status = %s, screen_failure_date = %s
        WHERE id = %s
        """
        cursor.execute(update_query, ('Screen Failure', screen_failure_date, patient_id))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "No patient updated (might be already screen failed or ID mismatch)"}), 200

        return jsonify({"message": "Screen failure recorded successfully", "patient_id": patient_id}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error recording screen failure: {e}")
        return jsonify({"message": "Failed to record screen failure", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
