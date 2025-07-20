import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const Notification = forwardRef((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('success'); // 'success' or 'error'
  const fadeAnim = useState(new Animated.Value(0))[0];

  useImperativeHandle(ref, () => ({
    show(msg, notificationType = 'success') {
      setMessage(msg);
      setType(notificationType);
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          hide();
        }, 3000); // 3秒後自動隱藏
      });
    },
  }));

  const hide = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  };

  if (!visible) {
    return null;
  }

  const containerStyle = [
    styles.container,
    type === 'success' ? styles.success : styles.error,
  ];

  return (
    <Animated.View style={[containerStyle, { opacity: fadeAnim }]}>
      <Text style={styles.messageText}>{message}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 8,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  success: {
    backgroundColor: '#4ade80', // green-400
  },
  error: {
    backgroundColor: '#f87171', // red-400
  },
  messageText: {
    color: '#1f2937', // gray-800
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Notification;