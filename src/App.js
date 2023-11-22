import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const generateUniqueId = () =>{
  return Math.random().toString(36).substr(2, 9);
};

let clientId = localStorage.getItem('client-id');

if (!clientId) {
  clientId = generateUniqueId(); // Hàm tạo ID độc nhất, có thể sử dụng UUID hoặc một thuật toán độc nhất khác
  localStorage.setItem('client-id', clientId);
}

const App = () => {
  const [socket, setSocket] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [clientList, setClientList] = useState([]);
  const [messageList, setMessageList] = useState([]);
  const refMessageList = React.useRef([]);

  const [isDisconnected, setDisconnected] = useState(false);

  useEffect(() => {
    // Kết nối tới máy chủ
    const socketInstance = io('http://localhost:4000',{
      query: {
        clientId,
      }
    });

    // Lưu đối tượng socket vào state
    setSocket(socketInstance);

    // Thực hiện các xử lý khác khi kết nối thành công
    socketInstance.on('connect', () => {
      console.log('Kết nối thành công đến máy chủ.');
    });

    socketInstance.on('client list', (clients) => {
      setClientList(clients);
    });

    socketInstance.on("reconnect", messages => {
      setMessageList(messages);
    });

    socketInstance.on('chat message', (msg, callback) => {
      callback({ status: "ok" });
      let tempMsgList = [
        ...refMessageList.current,
        msg
      ];
      refMessageList.current = tempMsgList;
      setMessageList(refMessageList.current);
    });

    // Lấy danh sách client khi component được tạo
    socketInstance.emit('get clients');
    socketInstance.emit('join', clientId);

    return () => {
      // Ngắt kết nối khi component unmount
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance.off('client list');
      }
    };
  }, []);

  const handleDisconnect = () => {
    // Ngắt kết nối tới máy chủ
    if (socket && !isDisconnected) {
      socket.disconnect();
      console.log('Ngắt kết nối tới máy chủ.');
      setDisconnected(true)
    } else {
      setDisconnected(false);
      socket.connect();
      socket.emit('join', clientId);
    }
  };

  const submitSocketIO = () => {
    socket.emit('chat message', inputValue);
    setInputValue('');
  };

  return (
    <div style={{ padding: 16, margin: "auto", width: "100vw", display: "flex", alignItems: "center", flexDirection: "column" }}>
      <h1>Ứng dụng React với Socket.IO</h1>
      <div>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          style={{
            marginBottom: 16,
            height: 30,
            width: 200,
            paddingLeft: 8
          }}
          placeholder='Nhập message'
        />
      </div>
      <div>
        <button
          onClick={submitSocketIO}
          style={{ width: 200, height: 40 }}
        >
          Gửi message
        </button>
      </div>
      <button style={{
        marginTop: 8,
        width: 200,
        height: 40,
        background: isDisconnected ? "blue" : "red",
        color: "#fff",
        fontWeight: "600"
      }} onClick={handleDisconnect}>
        {isDisconnected ? 'Kết nối lại' : 'Ngắt kết nối'}
      </button>

      <h1>Message List</h1>

      {
        messageList.map((msg) => (
          <div style={{ marginBottom: 8 }} key={Math.random()}>
            {msg}
          </div>
        ))
      }
    </div>
  );
};

export default App;