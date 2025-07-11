"""Initial migration

Revision ID: eee80d134c7c
Revises: 
Create Date: 2025-06-29 21:48:46.606347

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'eee80d134c7c'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False, comment='ID người dùng'),
    sa.Column('username', sa.String(length=50), nullable=False, comment='Tên đăng nhập'),
    sa.Column('password_hash', sa.String(length=255), nullable=False, comment='Mật khẩu đã mã hóa'),
    sa.Column('is_admin', sa.Boolean(), nullable=True, comment='Có phải admin không'),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='Thời gian tạo'),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, comment='Thời gian cập nhật'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_table('analysis_sessions',
    sa.Column('id', sa.Integer(), nullable=False, comment='ID phiên phân tích'),
    sa.Column('user_id', sa.Integer(), nullable=False, comment='ID người dùng'),
    sa.Column('session_start', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='Thời gian bắt đầu'),
    sa.Column('session_end', sa.DateTime(timezone=True), nullable=True, comment='Thời gian kết thúc'),
    sa.Column('status', sa.String(length=20), nullable=True, comment='Trạng thái phiên'),
    sa.Column('camera_resolution', sa.String(length=20), nullable=True, comment='Độ phân giải camera'),
    sa.Column('analysis_interval', sa.Float(), nullable=True, comment='Khoảng thời gian phân tích'),
    sa.Column('total_analyses', sa.Integer(), nullable=True, comment='Tổng số lần phân tích'),
    sa.Column('successful_detections', sa.Integer(), nullable=True, comment='Số lần phát hiện thành công'),
    sa.Column('failed_detections', sa.Integer(), nullable=True, comment='Số lần phát hiện thất bại'),
    sa.Column('detection_rate', sa.Float(), nullable=True, comment='Tỷ lệ phát hiện'),
    sa.Column('emotions_summary', sa.JSON(), nullable=True, comment='Tổng hợp cảm xúc'),
    sa.Column('average_engagement', sa.Float(), nullable=True, comment='Mức độ tương tác trung bình'),
    sa.Column('avg_processing_time', sa.Float(), nullable=True, comment='Thời gian xử lý trung bình'),
    sa.Column('avg_fps', sa.Float(), nullable=True, comment='FPS trung bình'),
    sa.Column('total_cache_hits', sa.Integer(), nullable=True, comment='Tổng số cache hits'),
    sa.Column('cache_hit_rate', sa.Float(), nullable=True, comment='Tỷ lệ cache hit'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analysis_sessions_id'), 'analysis_sessions', ['id'], unique=False)
    op.create_table('emotion_results',
    sa.Column('id', sa.Integer(), nullable=False, comment='ID kết quả'),
    sa.Column('user_id', sa.Integer(), nullable=False, comment='ID người dùng'),
    sa.Column('emotion', sa.String(length=20), nullable=False, comment='Cảm xúc chính'),
    sa.Column('score', sa.Float(), nullable=True, comment='Điểm số cảm xúc'),
    sa.Column('faces_detected', sa.Integer(), nullable=True, comment='Số khuôn mặt phát hiện được'),
    sa.Column('dominant_emotion', sa.String(length=20), nullable=True, comment='Cảm xúc chiếm ưu thế'),
    sa.Column('dominant_emotion_vn', sa.String(length=50), nullable=True, comment='Cảm xúc chiếm ưu thế (tiếng Việt)'),
    sa.Column('dominant_emotion_score', sa.Float(), nullable=True, comment='Điểm số cảm xúc chiếm ưu thế'),
    sa.Column('engagement', sa.String(length=20), nullable=True, comment='Mức độ tương tác'),
    sa.Column('emotions_scores', sa.JSON(), nullable=True, comment='Điểm số tất cả cảm xúc'),
    sa.Column('emotions_scores_vn', sa.JSON(), nullable=True, comment='Điểm số tất cả cảm xúc (tiếng Việt)'),
    sa.Column('image_quality', sa.Float(), nullable=True, comment='Chất lượng ảnh'),
    sa.Column('face_position', sa.JSON(), nullable=True, comment='Vị trí khuôn mặt'),
    sa.Column('analysis_duration', sa.Float(), nullable=True, comment='Thời gian phân tích'),
    sa.Column('confidence_level', sa.Float(), nullable=True, comment='Mức độ tin cậy'),
    sa.Column('processing_time', sa.Float(), nullable=True, comment='Thời gian xử lý'),
    sa.Column('avg_fps', sa.Float(), nullable=True, comment='FPS trung bình'),
    sa.Column('image_size', sa.String(length=20), nullable=True, comment='Kích thước ảnh'),
    sa.Column('cache_hits', sa.Integer(), nullable=True, comment='Số lần cache hit'),
    sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='Thời gian tạo'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_emotion_results_id'), 'emotion_results', ['id'], unique=False)
    op.create_table('system_logs',
    sa.Column('id', sa.Integer(), nullable=False, comment='ID log'),
    sa.Column('level', sa.String(length=20), nullable=False, comment='Mức độ log'),
    sa.Column('message', sa.Text(), nullable=False, comment='Nội dung log'),
    sa.Column('user_id', sa.Integer(), nullable=True, comment='ID người dùng (nếu có)'),
    sa.Column('ip_address', sa.String(length=45), nullable=True, comment='Địa chỉ IP'),
    sa.Column('user_agent', sa.Text(), nullable=True, comment='User agent'),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True, comment='Thời gian tạo'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_system_logs_id'), 'system_logs', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_system_logs_id'), table_name='system_logs')
    op.drop_table('system_logs')
    op.drop_index(op.f('ix_emotion_results_id'), table_name='emotion_results')
    op.drop_table('emotion_results')
    op.drop_index(op.f('ix_analysis_sessions_id'), table_name='analysis_sessions')
    op.drop_table('analysis_sessions')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
    # ### end Alembic commands ### 