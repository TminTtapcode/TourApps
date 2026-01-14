import React, { useState, useEffect, useCallback, useContext, useLayoutEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { collection, addDoc, orderBy, query, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Import file config ở bước 2
import { MyUserContext } from '../context/MyUserContext';

const Chat = ({ route, navigation }) => {
    const [user] = useContext(MyUserContext);
    const { providerId, providerName, providerAvatar } = route.params; // Nhận thông tin người nhận từ TourDetail
    const [messages, setMessages] = useState([]);

    // Tạo ID phòng chat duy nhất: Luôn là "IDnhỏ_IDlớn" để 2 người luôn vào đúng 1 phòng
    // Lưu ý: User ID và Provider ID phải là số hoặc chuỗi giống nhau
    const chatId = user.id < providerId
        ? `${user.id}-${providerId}`
        : `${providerId}-${user.id}`;

    // 1. Tùy chỉnh Header (Hiện tên người mình đang chat)
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: `Chat với ${providerName || "Nhà cung cấp"}`,
        });
    }, [navigation, providerName]);

    // 2. Lắng nghe tin nhắn từ Firestore (Real-time)
    useEffect(() => {
        // Trỏ vào collection: chats -> {chatId} -> messages
        const collectionRef = collection(db, 'chats', chatId, 'messages');
        const q = query(collectionRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, snapshot => {
            setMessages(
                snapshot.docs.map(doc => ({
                    _id: doc.id,
                    createdAt: doc.data().createdAt?.toDate(),
                    text: doc.data().text,
                    user: doc.data().user,
                }))
            );
        });

        return () => unsubscribe();
    }, [chatId]);

    // 3. Gửi tin nhắn
    const onSend = useCallback((messages = []) => {
        setMessages(previousMessages => GiftedChat.append(previousMessages, messages));

        const { _id, createdAt, text, user: msgUser } = messages[0];

        // Ghi vào Firestore
        addDoc(collection(db, 'chats', chatId, 'messages'), {
            _id,
            createdAt: serverTimestamp(), // Dùng giờ của server
            text,
            user: msgUser
        });
    }, [chatId]);

    // Custom màu bong bóng chat cho đẹp
    const renderBubble = (props) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: { backgroundColor: '#007AFF' }, // Màu tin nhắn của mình
                    left: { backgroundColor: '#e5e5ea' }   // Màu tin nhắn đối phương
                }}
            />
        );
    };

    if (!user) return <ActivityIndicator />;

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: user.id, // ID của người đang đăng nhập
                    name: user.username,
                    avatar: user.avatar || 'https://placeimg.com/140/140/any',
                }}
                renderBubble={renderBubble}
                placeholder="Nhập tin nhắn..."
                showUserAvatar
                alwaysShowSend
            />
        </View>
    );
};

export default Chat;