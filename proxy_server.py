from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import socket

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-Requested-With, Content-type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def run(port=8080):
    server_address = ('', port)
    try:
        httpd = HTTPServer(server_address, CORSRequestHandler)
        print(f"Starting proxy server on port {port}...")
        print(f"Server is running at http://localhost:{port}")
        httpd.serve_forever()
    except PermissionError:
        print(f"Error: Permission denied to bind to port {port}")
        print("Try using a different port or running with administrator privileges")
        sys.exit(1)
    except socket.error as e:
        print(f"Error: Could not bind to port {port}")
        print(f"Socket error: {e}")
        print("The port might be in use by another application")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()
        sys.exit(0)

if __name__ == '__main__':
    run() 