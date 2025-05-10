import os
import json
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from typing import Dict, List, Optional, Any

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/documents.readonly']

def get_credentials():
    """Gets valid user credentials from storage.
    
    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth 2.0 flow is completed to obtain the new credentials.
    """
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first time.
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    return creds

def get_document_content(service, document_id: str) -> Dict:
    """Retrieves the content of a Google Doc."""
    try:
        document = service.documents().get(documentId=document_id).execute()
        return document
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def parse_paragraph_style(paragraph: Dict) -> Dict[str, Any]:
    """Extracts styling information from a paragraph."""
    style = {}
    if 'paragraphStyle' in paragraph:
        ps = paragraph['paragraphStyle']
        if 'namedStyleType' in ps:
            style['type'] = ps['namedStyleType']
        if 'headingId' in ps:
            style['headingId'] = ps['headingId']
    return style

def get_text_content(elements: List[Dict]) -> str:
    """Extracts text content from paragraph elements."""
    text = ""
    for element in elements:
        if 'textRun' in element:
            text += element['textRun']['content']
    return text.strip()

def is_heading(style: Dict) -> bool:
    """Determines if a paragraph style represents a heading."""
    return style.get('type', '').startswith('HEADING_')

def get_heading_level(style: Dict) -> int:
    """Gets the heading level from a style."""
    if not is_heading(style):
        return 0
    try:
        return int(style['type'].split('_')[1])
    except (IndexError, ValueError):
        return 0

def process_document(document: Dict) -> Dict:
    """Processes a Google Doc and converts it to our JSON structure."""
    if not document or 'body' not in document:
        return {}

    result = {}
    current_section = result
    section_stack = []
    
    for content in document.get('body', {}).get('content', []):
        if 'paragraph' not in content:
            continue

        para = content['paragraph']
        style = parse_paragraph_style(para)
        text = get_text_content(para.get('elements', []))
        
        if not text:
            continue

        heading_level = get_heading_level(style)
        
        if heading_level > 0:
            # Pop sections until we're at the right level
            while len(section_stack) >= heading_level:
                section_stack.pop()

            # Create new section
            new_section = {
                "title": text,
                "content": "",
                "sections": []
            }

            # Add to parent section
            if section_stack:
                parent = section_stack[-1]
                parent["sections"].append(new_section)
            else:
                result[text] = new_section

            section_stack.append(new_section)
            current_section = new_section
        else:
            # Add content to current section
            if current_section.get('content'):
                current_section['content'] += '<br><br>' + text
            else:
                current_section['content'] = text

    return result

def convert_doc_to_json(document_id: str) -> Dict:
    """Main function to convert a Google Doc to our JSON format."""
    creds = get_credentials()
    service = build('docs', 'v1', credentials=creds)
    
    # Get the document content
    doc = get_document_content(service, document_id)
    if not doc:
        return {}
    
    # Process the document into our JSON structure
    result = process_document(doc)
    
    return result

if __name__ == '__main__':
    # Replace with your Google Document ID
    DOCUMENT_ID = input("Enter the Google Document ID: ")
    
    result = convert_doc_to_json(DOCUMENT_ID)
    
    # Save the result to a JSON file
    output_file = 'output_rules.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"Conversion complete! Results saved to {output_file}")
