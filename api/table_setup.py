from db import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()

create_patients_table = """CREATE TABLE IF NOT EXISTS patients (id VARCHAR(50),
    patient_name VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    enrollment_date DATE NOT NULL,
    informed_consent_date DATE, 
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    treatment VARCHAR(50),
    screen_failure_date DATE,
    Sites VARCHAR(10), -- Using VARCHAR as it appears to be a site code
    assigned_pack_id VARCHAR(50),
    TRT_Completion_Date DATE,
    Code_break DATE
);"""
cursor.execute(create_patients_table)

create_consignments_table = """
    CREATE TABLE IF NOT EXISTS consignments (
        consignment_id VARCHAR(50) PRIMARY KEY,
        pack_id VARCHAR(50),
        center_id VARCHAR(50),
        status VARCHAR(50),
        raise_date DATE,
        raised_by_user_id VARCHAR(50),
        created_at DATETIME
);"""

cursor.execute(create_consignments_table)

create_packs_table = """
CREATE TABLE IF NOT EXISTS packs (
    pack_number VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50), 
    centre VARCHAR(50),
    status VARCHAR(50),
    allocation_date DATE,
    pack_type VARCHAR(50)
);"""

cursor.execute(create_packs_table)

create_shipments_table="""
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    tracking_number VARCHAR(50),
    status VARCHAR(50),
    arrival_date DATE,
    notes TEXT, 
    received_by_user_id VARCHAR(50),
    created_at DATETIME
);"""

cursor.execute(create_shipments_table)

create_sites_table = """
CREATE TABLE IF NOT EXISTS sites (
    sites VARCHAR(50) PRIMARY KEY,
    site_name VARCHAR(50),
    site_activation VARCHAR(50),
    site_act_date DATE
);"""

cursor.execute(create_sites_table)

create_user_secret_code_table = """
CREATE TABLE IF NOT EXISTS user_secret_code (
    id INT NOT NULL AUTO_INCREMENT Primary Key,
    role VARCHAR(50),
    secret_code VARCHAR(50),
    created_at DATETIME
);
"""
cursor.execute(create_user_secret_code_table)

create_users_table = """
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT Primary Key,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255), 
    name VARCHAR(50),
    role VARCHAR(50),
    sites VARCHAR(50) 
);
"""

cursor.execute(create_users_table)
cursor.execute("Insert into users(username,password,role) values('Admin','$2b$12$tg8lY9DpUv5ZI4QONnCgleYR8KBd2xLNPsP9SF54J3AjBwuS.2RzS','Admin')")
conn.commit()