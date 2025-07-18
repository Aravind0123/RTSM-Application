from flask import Blueprint, request, jsonify
import uuid
from db import get_db_connection # Import from the shared db.py file

# Create a Blueprint for depot-related routes
depot_bp = Blueprint('depot', __name__)

@depot_bp.route('/raise_consignment', methods=['POST'])
def raise_consignment():
    """
    Handles raising a new consignment.
    Expects JSON: { "packId": "...", "centerId": "..." }
    """
    data = request.get_json()
    pack_id = data.get('packId')
    center_id = data.get('centerId') # Assuming centerId is provided by frontend

    if not all([pack_id, center_id]):
        return jsonify({"error": "Missing pack ID or center ID"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        check_pack = 'select pack_number from packs where pack_number = %s and centre="Depot" and status = "A" '
        cursor.execute(check_pack,(pack_id,))
        pack_available = cursor.fetchone()
        if pack_available is not None:
            check_consignment = 'SELECT MAX(CAST(SUBSTRING(consignment_id, 4, 3) AS UNSIGNED)) AS max_id_number FROM consignments'
            cursor.execute(check_consignment)
            check_consignment = cursor.fetchone()
            consignment_id= check_consignment[0] # Renamed to avoid confusion with new_patient_id string

            # Generate Unique patient Name
            if consignment_id is None:
                consignment_id = "CON-BYL" + "00" + str(1)
            else:
                next_id_num = str(consignment_id + 1)
                if len(next_id_num) == 1:
                    pat_id_padded = '00' + next_id_num
                elif len(next_id_num) == 2:
                    pat_id_padded = '0' + next_id_num
                else:
                    pat_id_padded = next_id_num
                consignment_id = "CON-BYL" + pat_id_padded
                
            raise_date = data.get('raiseDate', str(uuid.uuid4())[:10]) # Use provided date or generate current date
            # Assuming status is 'Raised' initially
            status = "Raised"

            insert_query = """
            INSERT INTO consignments (consignment_id, pack_id, center_id, status, raise_date)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (consignment_id, pack_id, center_id, status, raise_date))
            update_packs = 'update packs set centre = %s ,status="B" where pack_number= %s'
            cursor.execute(update_packs,(center_id,pack_id,))
            conn.commit()
            return jsonify({
                "message": "Consignment raised successfully",
                "consignment_id": consignment_id,
                "status": status
            }), 201
        else:
            status = "Failed"
            return jsonify({"message": "Pack is Not Availble in this Depot",
                            "status": status}),200

    except Exception as e:
        conn.rollback()
        print(f"Error raising consignment: {e}")
        return jsonify({"message": "Failed to raise consignment", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@depot_bp.route('/record_medical_arrival', methods=['POST'])
def record_medical_arrival():
    """
    Records the arrival of a medical shipment.
    Expects JSON: { "shipmentId": "...", "status": "...", "arrivalDate": "...", "notes": "..." }
    Status can be 'Arrived', 'Damaged', 'Quarantined'.
    """
    data = request.get_json()
    shipment_id = data.get('shipmentId')
    status = data.get('status')
    arrival_date = data.get('arrivalDate')
    notes = data.get('notes', '') # Notes are optional
    username = data.get('username')

    if not all([shipment_id, status, arrival_date]):
        return jsonify({"error": "Missing shipment ID, status, or arrival date"}), 400

    if status not in ['Arrived', 'Damaged', 'Quarantined']:
        return jsonify({"error": "Invalid shipment status. Must be 'Arrived', 'Damaged', or 'Quarantined'"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor()
    try:
        # Check if shipment already exists (optional, depends on desired behavior)
        # For simplicity, we'll assume new records for each arrival event.
        # If you need to update an existing shipment, you'd use UPDATE here.
        check_consignment = 'select * from consignments where consignment_id = %s'
        cursor.execute(check_consignment,(shipment_id,))
        consignment_data = cursor.fetchone()
        consignmnet_number = consignment_data[0] #checking shipment id is in  consignmnet table or not
        
    
        check_shipments = 'select * from shipments where shipment_id = %s'
        cursor.execute(check_shipments,(shipment_id,))
        data = cursor.fetchone() #checking the shipment is duplicate / already arrived?
        
        get_pack_id = 'select pack_id from consignments where consignment_id=%s'
        cursor.execute(get_pack_id,(consignmnet_number,))
        pack_id = cursor.fetchone()
        pack_id = pack_id[0]
        if data is None and consignment_data is not None:
            insert_query = """
            INSERT INTO shipments (shipment_id, status, arrival_date, notes,received_by_user_id)
            VALUES (%s, %s, %s, %s,%s)
            """
            cursor.execute(insert_query, (shipment_id, status, arrival_date, notes,username))
            print("shipments")
            if status == 'Arrived':
                p_status = 'A'
            elif status == 'Damanged':
                p_status = 'D'
            else:
                p_status ='Q'
            cursor.execute("Update packs set status=%s where pack_number = %s",(p_status,pack_id,))
            conn.commit()

            return jsonify({
                "message": "Medical shipment arrival recorded successfully",
                "shipment_id": shipment_id,
                "status": status
            }), 201
        elif data is not None:
            status = "Duplicate"
            return jsonify({
                "message" : " Shipment has already received ",
                "shipment_id" : shipment_id,
                "status" : status
            })
        else:
            status = 'Invalid'
            return jsonify({
                "message" : "Invalid Shipment Id",
                "shipment_id" :shipment_id,
                "status" : status
                
            })

    except Exception as e:
        conn.rollback()
        print(f"Error recording medical arrival: {e}")
        return jsonify({"message": "Failed to record medical arrival", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
