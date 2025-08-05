from flask import Blueprint, request, jsonify
import bcrypt
# Import get_db_connection from the new db.py file
from db import get_db_connection

# Create a Blueprint for authentication-related routes
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register_user():
    """
    Handles user registration.
    Expects JSON: { "username": "...", "password": "...", "secret_code": "...", "site": "..." }
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    secret_code = data.get('secret_code')
    site = data.get('site') # Get the site from the registration data

    if not all([username, password, secret_code, site]): # Ensure site is also present
        return jsonify({"message": "Missing username, password, secret code, or site"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Verify secret code and get role
        cursor.execute("SELECT role FROM user_secret_code WHERE secret_code = %s", (secret_code,))
        secret_code_data = cursor.fetchone()

        if not secret_code_data:
            return jsonify({"message": "Invalid secret code"}), 400

        role = secret_code_data['role']
        # Delete the secret code after successful use
        cursor.execute('DELETE FROM user_secret_code WHERE secret_code = %s', (secret_code,))

        # 2. Check if username already exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        existing_user = cursor.fetchone()
        if existing_user:
            return jsonify({"message": "Username already exists"}), 409

        # 3. Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # 4. Insert new user into the database, including the site
        insert_query = "INSERT INTO users (username, password, role, sites) VALUES (%s, %s, %s, %s)"
        cursor.execute(insert_query, (username, hashed_password, role, site))
        conn.commit()

        return jsonify({"message": "Registration successful", "role": role, "site": site}), 201

    except Exception as e: # Catch a broader exception to log all errors
        conn.rollback()
        print(f"Error during registration: {e}")
        return jsonify({"message": "Registration failed", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login_user():
    """
    Handles user login.
    Expects JSON: { "username": "...", "password": "..." }
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not all([username, password]):
        return jsonify({"message": "Missing username or password"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Retrieve user by username
        cursor.execute("SELECT id, username, password, role, sites FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
    
        if not user:
            return jsonify({"message": "Invalid username or password"}), 401

        # 2. Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({"message": "Invalid username or password"}), 401

        # Login successful
        return jsonify({"message": "Login successful", "username": user['username'], "role": user['role'], "site": user['sites']}), 200

    except Exception as e: # Catch a broader exception
        print(f"Error during login: {e}")
        return jsonify({"message": "Login failed", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/sites', methods=['GET'])
def get_sites():
    """
    Fetches all available sites from the database.
    Returns JSON: { "sites": ["Site A", "Site B", ...] }
    """
    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Assuming your sites are stored in a table named 'sites' with a column 'site_name'
        cursor.execute("SELECT site_name FROM sites")
        site_records = cursor.fetchall()
        
        # Extract site names into a list
        sites = [record['site_name'] for record in site_records]
        
        return jsonify({"sites": sites}), 200

    except Exception as e:
        print(f"Error fetching sites: {e}")
        return jsonify({"message": "Failed to fetch sites", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/update_user_site', methods=['POST'])
def update_user_site():
    """
    Updates the site for a given user.
    Expects JSON: { "username": "...", "site": "..." }
    """
    data = request.get_json()
    username = data.get('username')
    site = data.get('site')

    if not all([username, site]):
        return jsonify({"message": "Missing username or site"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        update_query = "UPDATE users SET sites = %s WHERE username = %s"
        cursor.execute(update_query, (site, username))
        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({"message": "User not found or site already set"}), 404
        
        return jsonify({"message": "User site updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        print(f"Error updating user site: {e}")
        return jsonify({"message": "Failed to update user site", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
# In your auth.py or a new blueprint file

@auth_bp.route('/pending_shipments', methods=['GET'])
def get_pending_shipments():
    """
    Fetches shipments that are pending arrival for a given site.
    Expects query parameter: ?site=SITE_NAME
    Returns JSON: { "shipments": ["SHP001", "SHP002"] }
    """
    site = request.args.get('site')
    print(site)
    if not site:
        return jsonify({"message": "Site parameter is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # IMPORTANT: Adjust this query based on your actual database schema
        # This example assumes a 'consignments' table with 'consignment_id', 'centerId', and 'status'
        # You'll need to define what 'pending' means in your status column.
        query = """
            SELECT consignment_id 
            FROM consignments 
            WHERE center_id = %s AND status = 'Raised' and
            consignment_id not in (select shipment_id from shipments)
        """
        cursor.execute(query, (site,))
        
        shipment_records = cursor.fetchall()
        
        # Extract shipment IDs into a list
        shipments = [record['consignment_id'] for record in shipment_records]
        
        return jsonify({"shipments": shipments}), 200

    except Exception as e:
        print(f"Error fetching pending shipments: {e}")
        return jsonify({"message": "Failed to fetch pending shipments", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
# In your Flask backend (e.g., auth.py)

@auth_bp.route('/get_user_site', methods=['GET'])
def get_user_site():
    """
    Fetches the site associated with a given username.
    Expects query parameter: ?username=USERNAME
    Returns JSON: { "site": "Site A" } or error message
    """
    username = request.args.get('username')

    if not username:
        return jsonify({"message": "Username parameter is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"message": "Database connection failed"}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT sites FROM users WHERE username = %s", (username,))
        user_data = cursor.fetchone()

        if user_data and user_data['sites']:
            return jsonify({"site": user_data['sites']}), 200
        else:
            return jsonify({"message": "User or site not found"}), 404

    except Exception as e:
        print(f"Error fetching user site: {e}")
        return jsonify({"message": "Failed to fetch user site", "error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()