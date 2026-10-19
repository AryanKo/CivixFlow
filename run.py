"""Dependency-free local preview server for the CivixFlow frontend."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import threading
import webbrowser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PublicFiles(SimpleHTTPRequestHandler):
    def is_public(self):
        path = unquote(urlsplit(self.path).path)
        if path in ('/', '/index.html') or path.startswith(('/js/', '/assets/')):
            relative = Path(self.translate_path(path)).resolve()
            public_root = Path(self.directory).resolve()
            allowed = relative == public_root / 'index.html' or any(
                relative.is_relative_to(public_root / folder) for folder in ('js', 'assets'))
            return (allowed and relative.is_file()) or (relative == public_root and path == '/')
        return False

    def do_GET(self):
        if not self.is_public():
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        if not self.is_public():
            self.send_error(404)
            return
        super().do_HEAD()

    def list_directory(self, path):
        self.send_error(404)
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--no-browser', action='store_true')
    args = parser.parse_args()
    frontend = Path(__file__).resolve().parent
    if not (frontend / 'assets/vendor/tailwind.css').exists():
        parser.error('Prebuilt assets missing. Run npm ci and npm run build once.')
    server = ThreadingHTTPServer((args.host, args.port), partial(PublicFiles, directory=str(frontend)))
    print(f'CivixFlow frontend: http://127.0.0.1:{args.port} (Ctrl+C to stop)', flush=True)
    if not args.no_browser:
        timer = threading.Timer(0.5, webbrowser.open, args=(f'http://127.0.0.1:{args.port}',))
        timer.daemon = True
        timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
