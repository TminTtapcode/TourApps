import pymysql

# Giả mạo phiên bản để Django tin rằng đây là mysqlclient mới nhất
pymysql.version_info = (1, 4, 3, "final", 0) # Hoặc set cao hơn nếu cần, nhưng thường Django chỉ check init
# Cập nhật: Với Django 4.2+ hoặc 5.0+, bạn cần fake version cao hơn hẳn:
pymysql.version_info = (2, 2, 2, "final", 0)

pymysql.install_as_MySQLdb()