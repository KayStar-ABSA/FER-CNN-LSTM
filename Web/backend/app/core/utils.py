import json
from typing import Dict, Any, Optional
from fastapi import Request, Query

def parse_json_param(param_value: str) -> Optional[Dict[str, Any]]:
    """
    Parse JSON parameter từ string
    """
    if not param_value:
        return None
    
    try:
        return json.loads(param_value)
    except (json.JSONDecodeError, TypeError):
        return None

def get_json_filters(request: Request, param_name: str = "filters") -> Dict[str, Any]:
    """
    Lấy filters từ JSON parameter trong request
    """
    filters_str = request.query_params.get(param_name)
    if filters_str:
        parsed_filters = parse_json_param(filters_str)
        if parsed_filters:
            return parsed_filters
    return {}

def get_json_config(request: Request, param_name: str = "config") -> Dict[str, Any]:
    """
    Lấy config từ JSON parameter trong request
    """
    config_str = request.query_params.get(param_name)
    if config_str:
        parsed_config = parse_json_param(config_str)
        if parsed_config:
            return parsed_config
    return {}

def validate_filters(filters: Dict[str, Any], allowed_fields: list) -> Dict[str, Any]:
    """
    Validate và filter các fields được phép
    """
    validated_filters = {}
    for field in allowed_fields:
        if field in filters:
            validated_filters[field] = filters[field]
    return validated_filters

def extract_common_filters(filters: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract các filters phổ biến từ JSON parameter
    """
    common_filters = {}
    
    # Period filter
    if 'period' in filters:
        period = filters['period']
        if period in ['day', 'week', 'month', 'year']:
            common_filters['period'] = period
    
    # Date range filter
    if 'dateRange' in filters:
        date_range = filters['dateRange']
        if isinstance(date_range, dict):
            if 'start' in date_range:
                common_filters['start_date'] = date_range['start']
            if 'end' in date_range:
                common_filters['end_date'] = date_range['end']
    
    # Limit filter
    if 'limit' in filters:
        limit = filters['limit']
        if isinstance(limit, int) and 1 <= limit <= 1000:
            common_filters['limit'] = limit
    
    # User ID filter
    if 'userId' in filters:
        user_id = filters['userId']
        if (isinstance(user_id, int) and user_id > 0) or (isinstance(user_id, str) and user_id == 'all'):
            common_filters['user_id'] = user_id
    
    # Emotions filter
    if 'emotions' in filters:
        emotions = filters['emotions']
        if isinstance(emotions, list):
            common_filters['emotions'] = emotions
    
    # Include details filter
    if 'includeDetails' in filters:
        include_details = filters['includeDetails']
        if isinstance(include_details, bool):
            common_filters['include_details'] = include_details
    
    return common_filters 