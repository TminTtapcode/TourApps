import { Ionicons } from '@expo/vector-icons'; // Thêm icon để làm nút +/-
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Image,
    Modal,
    ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native';
import API, { authApi, endpoints } from '../api/APIs';
import { MyUserContext } from '../context/MyUserContext';

const TourDetail = ({ route, navigation }) => {
    const { tourId } = route.params; 
    const [service, setService] = useState(null);
    const [comments, setComments] = useState([]); 
    const [content, setContent] = useState("");   
    const [user] = useContext(MyUserContext); 

    // --- STATE MỚI CHO CHỨC NĂNG BOOKING ---
    const [quantity, setQuantity] = useState(1);
    const [bookingModal, setBookingModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // 1. Lấy chi tiết Tour và Danh sách bình luận
    useEffect(() => {
        const loadData = async () => {
            try {
                const resService = await API.get(`${endpoints.services}${tourId}/`);
                setService(resService.data);
            } catch (ex) {
                console.error("Lỗi tải Tour:", ex);
                Alert.alert("Lỗi", "Không tải được thông tin tour.");
                return;
            }

            try {
                const resComments = await API.get(`${endpoints.services}${tourId}/comments/`);
                setComments(resComments.data);
            } catch (ex) {
                console.log("Lỗi tải Comments:", ex);
            }
        }
        
        loadData();
    }, [tourId]);
    

    // --- HÀM MỚI: Tăng giảm số lượng ---
    const adjustQuantity = (val) => {
        const newQty = quantity + val;
        // Kiểm tra logic: không < 1 và không > số chỗ còn trống (nếu server có trả về slots_available)
        // Nếu server chưa có slots_available, tạm thời chỉ check > 0
        const maxSlots = service.slots_available || 999; 
        
        if (newQty >= 1 && newQty <= maxSlots) {
            setQuantity(newQty);
        } else if (newQty > maxSlots) {
            Alert.alert("Hết chỗ", `Chỉ còn ${maxSlots} chỗ trống!`);
        }
    }

    // --- HÀM MỚI: Xử lý Đặt vé (Thay thế hàm booking cũ) ---
    const onBooking = async () => {
        // 1. Check đăng nhập
        if (!user) {
            Alert.alert(
                "Yêu cầu đăng nhập",
                "Bạn cần đăng nhập để đặt vé. Đăng nhập ngay?",
                [
                    { text: "Hủy", style: "cancel" },
                    { text: "Đồng ý", onPress: () => navigation.navigate("Login", { previousScreen: "TourDetail", tourId: tourId }) }
                ]
            );
            return;
        }

        // 2. Mở Modal xác nhận (chưa gọi API vội)
        setBookingModal(true);
    }

    // --- HÀM MỚI: Xác nhận đặt vé (Gọi API thật) ---
    const confirmBooking = async () => {
        setProcessing(true);
        try {
            const token = await AsyncStorage.getItem("access-token");
            await authApi(token).post(endpoints.bookings, {
                "service": tourId,
                "quantity": quantity,
                "payment_method": "CASH" // Mặc định tiền mặt
            });
            
            setBookingModal(false);
            Alert.alert("Thành công", "Đặt tour thành công! Vui lòng kiểm tra trong Lịch sử đặt vé.", [
                { text: "OK", onPress: () => navigation.navigate("Home") } // Về trang chủ hoặc trang MyBookings
            ]);
        } catch (ex) {
            console.error(ex);
            Alert.alert("Thất bại", "Có lỗi xảy ra hoặc tour đã hết chỗ.");
        } finally {
            setProcessing(false);
        }
    }

    // Hàm gửi Bình luận (Giữ nguyên)
    const addComment = async () => {
        if (!user) {
            Alert.alert("Thông báo", "Vui lòng đăng nhập để bình luận");
            return;
        }
        if (!content.trim()) return;

        try {
            const token = await AsyncStorage.getItem("access-token");
            const res = await authApi(token).post(`${endpoints.services}${tourId}/comments/`, {
                content: content,
                rating: 5 
            });
            setComments([res.data, ...comments]); 
            setContent(""); 
        } catch (ex) {
            console.error(ex);
            Alert.alert("Lỗi", "Không gửi được bình luận.");
        }
    }

    if (!service) return <ActivityIndicator style={{marginTop: 50}} size="large" color="#007AFF" />;

    return (
        <View style={{flex: 1, backgroundColor: 'white'}}> 
            {/* ScrollView chỉ chứa nội dung, không chứa nút đặt vé */}
            <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 100}}>
                <Image source={{ uri: service.image }} style={styles.image} />
                <View style={styles.content}>
                    <Text style={styles.title}>{service.name}</Text>
                    
                    <Text style={styles.info}>📍 {service.location}</Text>
                    <Text style={styles.info}>📅 Khởi hành: {moment(service.start_date).format('DD/MM/YYYY')}</Text>
                    
                    {/* Hiển thị số chỗ còn trống nếu có */}
                    {service.slots_available !== undefined && (
                        <Text style={{color: 'green', fontWeight: 'bold', marginVertical: 5}}>
                            🔥 Chỉ còn {service.slots_available} chỗ trống
                        </Text>
                    )}

                    <Text style={styles.desc}>{service.description}</Text>

                    {/* --- Phần Bình luận --- */}
                    <View style={styles.commentSection}>
                        <Text style={styles.sectionTitle}>Đánh giá & Bình luận</Text>
                        
                        {user ? (
                            <View style={styles.inputContainer}>
                                <Image source={{ uri: user.avatar }} style={styles.avatarSmall} />
                                <TextInput 
                                    style={styles.input} 
                                    placeholder="Viết đánh giá..." 
                                    value={content}
                                    onChangeText={setContent}
                                />
                                <TouchableOpacity onPress={addComment}>
                                    <Text style={styles.sendBtn}>Gửi</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <Text style={styles.loginHint}>Đăng nhập để viết bình luận</Text>
                        )}

                        {comments.map(c => (
                            <View key={c.id} style={styles.commentItem}>
                                <Image source={{uri: c.user.avatar}} style={styles.avatarSmall} />
                                <View style={styles.commentContent}>
                                    <Text style={styles.commentUser}>{c.user.username}</Text>
                                    <Text style={styles.commentText}>{c.content}</Text>
                                    <Text style={styles.commentDate}>{moment(c.created_date).fromNow()}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
            {user && user.id !== service.provider.id && (
                <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => navigation.navigate("Chat", {
                        providerId: service.provider.id || service.provider, // ID nhà cung cấp
                        providerName: "Nhà cung cấp", // Hoặc lấy service.provider.first_name nếu API trả về
                        providerAvatar: null
                    })}
                >
                    <Ionicons name="chatbubble-ellipses" size={28} color="white" />
                </TouchableOpacity>
            )}
            {/* --- THANH BOTTOM BAR (CỐ ĐỊNH Ở ĐÁY) --- */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={{fontSize: 12, color: 'gray'}}>Tổng tiền tạm tính:</Text>
                    <Text style={styles.totalPrice}>
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price * quantity)}
                    </Text>
                </View>
                
                {/* Nút Đặt ngay sẽ mở Modal */}
                <TouchableOpacity style={styles.bookBtn} onPress={onBooking}>
                    <Text style={styles.bookBtnText}>ĐẶT NGAY</Text>
                </TouchableOpacity>
            </View>

            {/* --- MODAL XÁC NHẬN --- */}
            <Modal transparent={true} visible={bookingModal} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Xác nhận đặt tour</Text>
                        <Text style={styles.modalText}>Tour: {service.name}</Text>
                        
                        {/* Chọn số lượng trong Modal */}
                        <View style={styles.qtyRow}>
                            <Text style={{fontSize: 16}}>Số khách:</Text>
                            <View style={styles.qtyControl}>
                                <TouchableOpacity onPress={() => adjustQuantity(-1)}>
                                    <Ionicons name="remove-circle-outline" size={32} color={quantity > 1 ? "#007AFF" : "#ccc"} />
                                </TouchableOpacity>
                                <Text style={styles.qtyNum}>{quantity}</Text>
                                <TouchableOpacity onPress={() => adjustQuantity(1)}>
                                    <Ionicons name="add-circle" size={32} color="#007AFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={[styles.modalText, {marginTop: 15, fontWeight: 'bold', fontSize: 18, color: '#d9534f', textAlign: 'center'}]}>
                            Tổng: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price * quantity)}
                        </Text>

                        {processing ? <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 15}}/> : (
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#ccc'}]} onPress={() => setBookingModal(false)}>
                                    <Text>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#007AFF'}]} onPress={confirmBooking}>
                                    <Text style={{color: 'white', fontWeight: 'bold'}}>Xác nhận</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 }, // ScrollView nằm trong view flex 1
    image: { width: '100%', height: 250 },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 5, color: '#333' },
    info: { fontSize: 15, marginBottom: 5, color: '#555' },
    desc: { lineHeight: 24, color: '#444', fontSize: 15, marginTop: 15 },

    // Style Comment
    commentSection: { borderTopWidth: 5, borderTopColor: '#f5f5f5', paddingTop: 20, marginTop: 20 },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    input: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 10 },
    sendBtn: { color: '#007AFF', fontWeight: 'bold', fontSize: 16 },
    loginHint: { color: 'gray', fontStyle: 'italic', marginBottom: 15 },
    commentItem: { flexDirection: 'row', marginBottom: 15 },
    avatarSmall: { width: 40, height: 40, borderRadius: 20 },
    commentContent: { marginLeft: 10, flex: 1, backgroundColor: '#f0f2f5', padding: 10, borderRadius: 12 },
    commentUser: { fontWeight: 'bold', marginBottom: 2 },
    commentText: { color: '#333', marginBottom: 5 },
    commentDate: { fontSize: 11, color: 'gray' },

    // --- STYLE MỚI CHO BOTTOM BAR & MODAL ---
    bottomBar: { 
        position: 'absolute', bottom: 0, left: 0, right: 0, 
        backgroundColor: 'white', borderTopWidth: 1, borderColor: '#ddd',
        padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        elevation: 10 
    },
    totalPrice: { fontSize: 18, fontWeight: 'bold', color: '#d9534f' },
    bookBtn: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8 },
    bookBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: 'white', padding: 20, borderRadius: 12, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
    modalText: { fontSize: 16, marginBottom: 5 },
    qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
    qtyControl: { flexDirection: 'row', alignItems: 'center' },
    qtyNum: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 15, width: 30, textAlign: 'center' },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    btnAction: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 }
    chatBtn: {
        position: 'absolute',
        bottom: 90, // Nằm trên thanh Bottom Bar một chút
        right: 20,
        backgroundColor: '#007AFF', // Màu xanh
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5, // Đổ bóng cho Android
        shadowColor: '#000', // Đổ bóng cho iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 100 // Đảm bảo luôn nổi lên trên
    }
});

export default TourDetail;