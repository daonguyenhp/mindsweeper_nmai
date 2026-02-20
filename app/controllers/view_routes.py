from flask import Blueprint, render_template

# Tạo một Blueprint tên là 'views'
view_bp = Blueprint('views', __name__)

@view_bp.route('/')
def index():
    """Trang chủ Game"""
    return render_template('index.html')