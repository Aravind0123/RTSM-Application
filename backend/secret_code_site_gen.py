from flask import Blueprint,jsonify,request
from db import get_db_connection

secret_site = Blueprint('secret_site',__name__)

@secret_site.route('/generate_and_save_codes', methods=['POST'])
def generate_and_save_codes():
    data = request.get_json() # Get JSON data from the request body

    if not data or 'codes' not in data:
        return jsonify({'error': 'Invalid request: "codes" array missing.'}), 400

    codes_to_save = data['codes']
    if not isinstance(codes_to_save, list):
        return jsonify({'error': 'Invalid request: "codes" must be an array.'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor()
    saved_count = 0
    errors = []
    for item in codes_to_save:
        role = item.get('role')
        secret_code = item.get('code')

        if not role or not secret_code:
            errors.append(f"Skipping invalid item: {item}. Both 'role' and 'code' are required.")
            continue

        try:
            # Insert the role and secret code into the database
            cursor.execute(
                "INSERT INTO user_secret_code (role, secret_code) VALUES (%s, %s)",
                (role, secret_code)
            )
            saved_count += 1
        except Exception as err:
            # Handle duplicate entry error (secret_code is UNIQUE)
            if err.errno == 1062: # MySQL error code for duplicate entry
                errors.append(f"Duplicate code '{secret_code}' for role '{role}'. Skipping.")
            else:
                errors.append(f"Error saving code '{secret_code}' for role '{role}': {err}")
            print(f"Database error: {err}") # Log the error for debugging

    try:
        conn.commit() # Commit all changes to the database
    except Exception as err:
        conn.rollback() # Rollback in case of a commit error
        print(f"Error during commit: {err}")
        return jsonify({'error': f'Failed to commit changes to database: {err}', 'saved_count': saved_count, 'details': errors}), 500
    finally:
        cursor.close()
        conn.close()

    if errors:
        return jsonify({
            'message': f'Successfully saved {saved_count} codes. Some errors occurred:',
            'details': errors
        }), 200
    else:
        return jsonify({'message': f'Successfully saved {saved_count} codes.'}), 200

# NEW: REST API endpoint to save site details
@secret_site.route('/save_site_details', methods=['POST'])
def save_site_details():
    data = request.get_json()

    # Validate incoming data
    required_fields = ['siteCode', 'siteName', 'activationStatus', 'activationDate']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required site details fields.'}), 400

    site_code = data.get('siteCode')
    site_name = data.get('siteName')
    activation_status = data.get('activationStatus')
    activation_date = data.get('activationDate')

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed.'}), 500

    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO sites (sites, site_name, site_activation, site_act_date) VALUES (%s, %s, %s, %s)",
            (site_code, site_name, activation_status, activation_date)
        )
        conn.commit()
        return jsonify({'message': 'Site details saved successfully!'}), 201 # 201 Created
    except Exception as err:
        conn.rollback()
        if err.errno == 1062: # Duplicate entry for site_code
            return jsonify({'error': f"Duplicate site code '{site_code}'. Site already exists."}), 409 # 409 Conflict
        else:
            print(f"Error saving site details: {err}")
            return jsonify({'error': f'Failed to save site details: {err}'}), 500
    finally:
        cursor.close()
        conn.close()