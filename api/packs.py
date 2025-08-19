from db import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()
pack = 'PLACEBO'
for i in range(1,501):
    i = str(i)
    if len(i)==1:
        i = '00'+i
    elif len(i)==2:
        i = '0'+i
    if i == '250':
        pack = '10_MG'
    cursor.execute("insert into packs(pack_number,centre,status,pack_type) values(%s,%s,%s,%s)",('BYL'+i,"Depot","A",pack))
conn.commit()
