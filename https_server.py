import http.server
import ssl
import os
import sys
import time
import logging
from datetime import datetime, timedelta, UTC
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

# Server configuration
PORT = 8080
CERT_FILE = "certs/localhost.crt"
KEY_FILE = "certs/localhost.key"
MAX_RETRIES = 5
RETRY_DELAY = 5  # seconds

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

def generate_self_signed_cert():
    try:
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )

        # Generate certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
        ])
        
        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.now(UTC)
        ).not_valid_after(
            datetime.now(UTC) + timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([x509.DNSName(u"localhost")]),
            critical=False,
        ).sign(private_key, hashes.SHA256())

        # Write private key
        with open(KEY_FILE, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            ))

        # Write certificate
        with open(CERT_FILE, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))
        
        logging.info("Successfully generated self-signed certificate")
    except Exception as e:
        logging.error(f"Error generating certificate: {str(e)}")
        raise

def start_server():
    try:
        # Create self-signed certificate if it doesn't exist
        if not os.path.exists(CERT_FILE) or not os.path.exists(KEY_FILE):
            logging.info("Generating self-signed certificate...")
            os.makedirs("certs", exist_ok=True)
            generate_self_signed_cert()

        # Create HTTPS server
        Handler = http.server.SimpleHTTPRequestHandler
        httpd = http.server.HTTPServer(("127.0.0.1", PORT), Handler)

        # Create SSL context
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)

        # Wrap the socket with SSL
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

        logging.info(f"Serving HTTPS on https://127.0.0.1:{PORT}")
        logging.info("Note: You may need to accept the self-signed certificate warning in your browser")
        
        return httpd
    except Exception as e:
        logging.error(f"Error starting server: {str(e)}")
        raise

def run_server():
    retry_count = 0
    while retry_count < MAX_RETRIES:
        try:
            httpd = start_server()
            httpd.serve_forever()
        except Exception as e:
            retry_count += 1
            logging.error(f"Server crashed (attempt {retry_count}/{MAX_RETRIES}): {str(e)}")
            if retry_count < MAX_RETRIES:
                logging.info(f"Restarting server in {RETRY_DELAY} seconds...")
                time.sleep(RETRY_DELAY)
            else:
                logging.error("Max retries reached. Server failed to start.")
                sys.exit(1)

if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        logging.info("Server stopped by user")
        sys.exit(0) 