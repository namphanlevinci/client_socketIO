import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

let clientId = localStorage.getItem('client-id');

if (!clientId) {
  clientId = generateUniqueId(); // Hàm tạo ID độc nhất, có thể sử dụng UUID hoặc một thuật toán độc nhất khác
  localStorage.setItem('client-id', clientId);
}

const numberOfBots = 100; // Số lượng bot bạn muốn tạo

const App = () => {
  const [socket, setSocket] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [clientList, setClientList] = useState([]);
  const [messageList, setMessageList] = useState([]);
  const refMessageList = React.useRef([]);
  const refSoclketList = React.useRef([]);

  const [isDisconnected, setDisconnected] = useState(false);

  React.useLayoutEffect(() => {
    // console.log('useEffect')
    // Kết nối tới máy chủ
    const connectSocket = (i) => {
      const socketInstance = io('139.59.126.96:4000', {
      });


      // Thực hiện các xử lý khác khi kết nối thành công
      socketInstance.on('connect', () => {
        console.log(`Xin chào từ bot số ${i + 1}!`);
        let temp = [
          ...refSoclketList.current,
          socketInstance
        ];
        refSoclketList.current = temp;
        setSocket(temp);

        // socketInstance.emit('chat message', "test message");

        // setSocket(socket.push(socketInstance));
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
          {
            ["id"]: `${i}`,
            message: `${msg} ${i + 1}`
          }
        ];
        refMessageList.current = tempMsgList;
        setMessageList(refMessageList.current);
      });

      // Lấy danh sách client khi component được tạo
      socketInstance.emit('get clients');
      socketInstance.emit('join', `${clientId} ${i}`);
    };
    for (let i = 0; i < numberOfBots; i++) {
      connectSocket(i);
    };

    // return () => {
    //   // Ngắt kết nối khi component unmount
    //   if (socketInstance) {
    //     socketInstance.disconnect();
    //     socketInstance.off('client list');
    //   }
    // };
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
    console.log("length : ", socket.length)
    // for(let i = 0 ; i < socket.length ; i++){
    //   socket[i].emit('chat message', `${inputValue} ${i}`);
    // }
    socket[0].emit('chat message', `${inputValue}`);

    setInputValue('');
  };

  let list = messageList.sort((a, b) => a.id-b.id);

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
        list.map((msg) => (
          <div style={{ marginBottom: 8 }} key={Math.random()}>
            {msg.message}
          </div>
        ))
      }
    </div>
  );
};

export default App;