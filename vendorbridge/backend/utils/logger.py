from ..models.activity_log import ActivityLog


def log_activity(db, user_id, action, entity_type, entity_id, description, ip_address=None):
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        description=description,
        ip_address=ip_address,
    )
    db.add(log)
