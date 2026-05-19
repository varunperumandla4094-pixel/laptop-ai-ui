import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {

  const [conversations, setConversations] =
    useState([]);

  const [activeChatId, setActiveChatId] =
    useState(null);

  const [input, setInput] = useState("");

  // ACTIVE CONVERSATION
  const activeConversation =
    conversations.find(
      (conv) => conv.id === activeChatId
    );

  // LOAD CONVERSATIONS
  useEffect(() => {

    const savedConversations =
      localStorage.getItem("conversations");

    if (savedConversations) {

      const parsedConversations =
        JSON.parse(savedConversations);

      setConversations(parsedConversations);

      if (parsedConversations.length > 0) {
        setActiveChatId(
          parsedConversations[0].id
        );
      }

    } else {

      // CREATE DEFAULT CHAT
      const defaultConversation = {
        id: Date.now(),
        title: "New Chat",
        messages: [],
      };

      setConversations([defaultConversation]);

      setActiveChatId(defaultConversation.id);
    }

  }, []);

  // SAVE CONVERSATIONS
  useEffect(() => {

    if (conversations.length > 0) {

      localStorage.setItem(
        "conversations",
        JSON.stringify(conversations)
      );

    }

  }, [conversations]);

  // CREATE NEW CHAT
  const createNewChat = () => {

    const newConversation = {
      id: Date.now(),
      title: "New Chat",
      messages: [],
    };

    const updatedConversations = [
      newConversation,
      ...conversations,
    ];

    setConversations(updatedConversations);

    setActiveChatId(newConversation.id);

    localStorage.setItem(
      "conversations",
      JSON.stringify(updatedConversations)
    );
  };

  // SEND MESSAGE
  const sendMessage = async () => {

    if (!input.trim()) return;

    if (!activeConversation) {
    createNewChat();
    return;
  }
  
    const currentChatId = activeChatId;

    const userMessage = {
      sender: "user",
      text: input,
    };

    // ADD USER MESSAGE
    const updatedConversations =
      conversations.map((conv) => {

        if (conv.id === currentChatId) {

          return {
            ...conv,

            title:
              conv.messages.length === 0
                ? input.slice(0, 30)
                : conv.title,

            messages: [
              ...conv.messages,
              userMessage,
            ],
          };
        }

        return conv;
      });

    setConversations(updatedConversations);

    const userInput = input;

    setInput("");

    try {

      const response = await axios.post(
        "http://127.0.0.1:8000/chat",
        {
          message: userInput,
        }
      );

      const botMessage = {
        sender: "bot",
        text: response.data.response,
      };

      // ADD BOT RESPONSE
      setConversations((prev) =>
        prev.map((conv) => {

          if (conv.id === currentChatId) {

            return {
              ...conv,
              messages: [
                ...conv.messages,
                botMessage,
              ],
            };
          }

          return conv;
        })
      );

    } catch (error) {
      console.log(error);
    }
  };

  return (

    <div className="app">

      {/* SIDEBAR */}
      <div className="sidebar">

        <h2>💻 Laptop AI</h2>

        <button
          className="new-chat"
          onClick={createNewChat}
        >
          + New Chat
        </button>

        <div className="conversation-list">

          {conversations.map((conv) => (

            <div
              key={conv.id}
              className={`conversation-item ${
                activeChatId === conv.id
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveChatId(conv.id)
              }
            >
              {conv.title}
            </div>

          ))}

        </div>

        <div className="sidebar-footer">
          AI Laptop Expert
        </div>

      </div>

      {/* CHAT SECTION */}
      <div className="chat-section">

        <div className="chat-header">
          Laptop Assistant
        </div>

        <div className="chat-box">

          {(!activeConversation ||
            activeConversation.messages.length === 0) && (

            <div className="welcome">
              Ask me anything about laptops 🚀
            </div>

          )}

          {activeConversation?.messages.map(
            (msg, index) => (

              <div
                key={index}
                className={`message ${msg.sender}`}
              >

                <div className="markdown-content">

                  <ReactMarkdown>
                    {msg.text}
                  </ReactMarkdown>

                </div>

              </div>

          ))}

        </div>

        {/* INPUT AREA */}
        <div className="input-area">

          <input
            type="text"
            placeholder="Ask about laptops..."
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            onKeyDown={(e) =>
              e.key === "Enter" &&
              sendMessage()
            }
          />

          <button onClick={sendMessage}>
            Send
          </button>

        </div>

      </div>

    </div>
  );
}

export default App;