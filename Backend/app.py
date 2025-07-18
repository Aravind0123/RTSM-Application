from flask import Flask, jsonify
from flask_cors import CORS

# Import blueprints from your route files
from auth_routes import auth_bp
from patient_routes import patient_bp
from ScreenFailure import patient_sf
from depot_routes import depot_bp
from randomisation import patient_rd
from TreatmentCompletion import patient_tc
from EmergencyCodeBreak import patient_ecb
from Monitor_routes import monitor_bp



# Import get_db_connection from the new db.py file
from db import get_db_connection


app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Register Blueprints
# Blueprints help organize routes into modular components
app.register_blueprint(auth_bp)
app.register_blueprint(patient_bp)
app.register_blueprint(patient_sf)
app.register_blueprint(depot_bp)
app.register_blueprint(patient_rd)
app.register_blueprint(patient_tc)
app.register_blueprint(patient_ecb)
app.register_blueprint(monitor_bp)

@app.route('/')
def home():
    """Basic home route to confirm the backend is running."""
    return "Flask backend is running!"

if __name__ == '__main__':
    # To run this Flask app:
    # 1. Save this file as app.py
    # 2. Save auth_routes.py, patient_routes.py, and db.py in the same directory
    # 3. Install dependencies: pip install Flask mysql-connector-python bcrypt flask-cors
    # 4. Run from your terminal: python app.py
    # The app will run on http://127.0.0.1:5000/
    app.run(debug=True) # debug=True for development, set to False for production
