import sys
import json
from wtpsplit import SaT

sat_sm = SaT("sat-3l-sm")

def process_request(text):
    try:
        sentences = sat_sm.split(text)
        return sentences
    except Exception:
        raise Exception("Falied to segment the text: " + text)


while True:
    # Read a line from stdin (each line is a separate request)
    request = sys.stdin.readline()
    if not request:
        break 
    try:
        text = request.strip()
        sentences = process_request(text)
        response = {"sentences": sentences, "error": None}
        sys.stdout.write(json.dumps(response)+ '\n')
        sys.stdout.flush()

    except Exception as ex:
        error_response = {"sentences": None, "error": str(ex)}
        sys.stdout.write(json.dumps(error_response) + '\n')
        sys.stdout.flush()
    
