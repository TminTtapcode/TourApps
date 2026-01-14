import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator, FlatList,
    Modal,
    ScrollView, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
import API, { endpoints } from '../api/APIs';
import TourItem from '../components/TourItem';

const Home = ({ navigation }) => {
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [cateId, setCateId] = useState("");

    const [modalVisible, setModalVisible] = useState(false);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [locationInput, setLocationInput] = useState("");
    const [tempFilter, setTempFilter] = useState({ min: "", max: "", loc: "" });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Load danh mục
                const resCates = await API.get(endpoints.categories);
                setCategories(resCates.data.results || resCates.data);

                // --- [FIX QUAN TRỌNG] Đổi 'q' thành 'search' ---
                let url = `${endpoints.services}?search=${q}`;

                if (cateId) url += `&category_id=${cateId}`;
                if (minPrice) url += `&min_price=${minPrice}`;
                if (maxPrice) url += `&max_price=${maxPrice}`;
                if (locationInput) url += `&location=${locationInput}`;

                console.log("Calling API:", url);

                const resServices = await API.get(url);
                setServices(resServices.data.results || resServices.data);
            } catch (ex) {
                console.error("Lỗi Home:", ex);
            } finally {
                setLoading(false);
            }
        };

        // Kỹ thuật Debounce: Chờ 500ms sau khi gõ xong mới gọi API để tránh lag
        const timer = setTimeout(() => {
            fetchData();
        }, 500);

        return () => clearTimeout(timer);

    }, [q, cateId, minPrice, maxPrice, locationInput]);

    const openFilter = () => {
        setTempFilter({ min: minPrice, max: maxPrice, loc: locationInput });
        setModalVisible(true);
    }

    const applyFilter = () => {
        setMinPrice(tempFilter.min);
        setMaxPrice(tempFilter.max);
        setLocationInput(tempFilter.loc);
        setModalVisible(false);
    }

   return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color="gray" style={{marginRight: 5}} />
                    <TextInput
                        style={styles.input}
                        placeholder="Tìm kiếm (tên, địa điểm)..."
                        value={q}
                        onChangeText={setQ}
                    />
                </View>
                <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
                    <Ionicons name="options" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View style={{ height: 50 }}>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cateScroll}>
                    <TouchableOpacity onPress={() => setCateId("")} style={[styles.cateItem, cateId === "" ? styles.activeCate : null]}>
                        <Text style={cateId === "" ? styles.activeText : styles.text}>Tất cả</Text>
                    </TouchableOpacity>
                    {categories.map(c => (
                        <TouchableOpacity key={c.id} onPress={() => setCateId(c.id)} style={[styles.cateItem, cateId === c.id ? styles.activeCate : null]}>
                            <Text style={cateId === c.id ? styles.activeText : styles.text}>{c.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading ? <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}} /> : (
                <FlatList
                    data={services}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <TourItem
                            item={item}
                            onPress={() => navigation.navigate("TourDetail", { tourId: item.id })}
                        />
                    )}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 20, color: 'gray'}}>Không tìm thấy tour nào.</Text>}
                />
            )}

            {/* --- MODAL GIỮ NGUYÊN --- */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Bộ lọc tìm kiếm</Text>

                        <Text style={styles.label}>Địa điểm:</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="VD: Đà Nẵng, Sa Pa..."
                            value={tempFilter.loc}
                            onChangeText={(t) => setTempFilter({...tempFilter, loc: t})}
                        />

                        <Text style={styles.label}>Khoảng giá (VND):</Text>
                        <View style={styles.priceRow}>
                            <TextInput
                                style={[styles.modalInput, {flex: 1}]}
                                placeholder="Tối thiểu"
                                keyboardType="numeric"
                                value={tempFilter.min}
                                onChangeText={(t) => setTempFilter({...tempFilter, min: t})}
                            />
                            <Text style={{marginHorizontal: 10}}>-</Text>
                            <TextInput
                                style={[styles.modalInput, {flex: 1}]}
                                placeholder="Tối đa"
                                keyboardType="numeric"
                                value={tempFilter.max}
                                onChangeText={(t) => setTempFilter({...tempFilter, max: t})}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.btn, {backgroundColor: '#ccc'}]} onPress={() => setModalVisible(false)}>
                                <Text>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btn} onPress={applyFilter}>
                                <Text style={{color: 'white', fontWeight: 'bold'}}>Áp dụng</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ... Styles giữ nguyên ...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    headerRow: { flexDirection: 'row', padding: 10, alignItems: 'center', backgroundColor: 'white' },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', paddingHorizontal: 10, borderRadius: 8, height: 40 },
    input: { flex: 1, marginLeft: 5 },
    filterBtn: { marginLeft: 10, backgroundColor: '#007AFF', padding: 8, borderRadius: 8 },
    cateScroll: { paddingHorizontal: 10, alignItems: 'center', paddingVertical: 10 },
    cateItem: { paddingHorizontal: 15, paddingVertical: 6, marginRight: 10, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#ddd' },
    activeCate: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    text: { color: 'black' },
    activeText: { color: 'white', fontWeight: 'bold' },
    modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { margin: 20, backgroundColor: 'white', borderRadius: 20, padding: 25, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
    label: { fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
    modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, backgroundColor: '#f9f9f9' },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
    btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, backgroundColor: '#007AFF' }
});

export default Home;