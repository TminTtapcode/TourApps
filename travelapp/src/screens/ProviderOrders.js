import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { authApi, endpoints } from '../api/APIs';

const ProviderOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const token = await AsyncStorage.getItem("access-token");
                const res = await authApi(token).get(endpoints['bookings']);
                setOrders(res.data.results || res.data);
            } catch (ex) {
                console.error(ex);
            } finally {
                setLoading(false);
            }
        };
        loadOrders();
    }, []);

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <Text style={styles.id}>Đơn #{item.id}</Text>
                <Text style={styles.date}>{moment(item.created_date).format("DD/MM/YYYY HH:mm")}</Text>
            </View>
            <Text style={styles.customer}>👤 Khách: {item.user?.username || "Khách vãng lai"}</Text>

            {/* --- [FIX QUAN TRỌNG] --- */}
            <Text style={styles.tourName}>🏖 {item.service_detail?.name || "Tên Tour lỗi"}</Text>

            <Text style={styles.total}>💰 Tổng tiền: {new Intl.NumberFormat('vi-VN').format(item.total_price)} VNĐ</Text>

            <View style={[styles.statusBadge, item.status === 'PENDING' ? {backgroundColor: '#FFF3E0'} : {}]}>
                 <Text style={{color: item.status === 'PENDING' ? 'orange' : 'green', fontWeight: 'bold'}}>
                    {item.status === 'PENDING' ? '⏳ Chờ thanh toán' : '✅ Đã xác nhận'}
                 </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.header}>🛒 Đơn hàng khách đặt</Text>
            {loading ? <ActivityIndicator /> : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 15 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
    card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 5 },
    id: { fontWeight: 'bold', color: '#555' },
    date: { color: 'gray', fontSize: 12 },
    customer: { fontSize: 16, marginTop: 5 },
    tourName: { fontSize: 16, fontWeight: 'bold', color: '#007AFF', marginVertical: 5 },
    total: { fontSize: 16, color: '#d9534f', fontWeight: 'bold' },
    statusBadge: { alignSelf: 'flex-start', backgroundColor: '#e8f5e9', padding: 5, borderRadius: 5, marginTop: 10 }
});

export default ProviderOrders;