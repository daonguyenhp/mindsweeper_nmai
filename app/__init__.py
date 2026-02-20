# app/__init__.py
from flask import Flask
from flask_socketio import SocketIO

# Khởi tạo đối tượng socketio
socketio = SocketIO()

def create_app():
    app = Flask(__name__, 
                template_folder='views',
                static_folder='public',
                static_url_path='/public')
    
    app.config['SECRET_KEY'] = 'secret!' # Key bảo mật session

    # Khởi tạo socketio với app
    socketio.init_app(app, cors_allowed_origins="*") # Cho phép mọi nguồn kết nối (dev mode)

    # Import và đăng ký Blueprint từ controllers
    from app.controllers import view_bp, api_bp
    app.register_blueprint(view_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    # Import socket events để nó lắng nghe sự kiện
    # Lưu ý: Import bên trong hàm hoặc cuối file để tránh Circular Import
    with app.app_context():
        from app.controllers import game_controller, ai_controller

    return app