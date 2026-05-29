import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

function App() {

  const [conversations, setConversations] =
    useState([]);

  const [activeChatId, setActiveChatId] =
    useState(null);

  const messagesEndRef = useRef(null);

  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

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

  useEffect(() => {

  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });

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

      setLoading(true);

      const response = await fetch(
      "https://laptop-ai-ui.vercel.app/stream-chat",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: userInput,
    }),
  }
);

const reader = response.body.getReader();

const decoder = new TextDecoder();


const tempBotMessage = {
  sender: "bot",
  text: "",
  products: [],
};

setConversations((prev) =>
  prev.map((conv) => {

    if (conv.id === currentChatId) {

      return {
        ...conv,
        messages: [
          ...conv.messages,
          tempBotMessage,
        ],
      };

    }

    return conv;

  })
);

while (true) {

  const { done, value } =
    await reader.read();

  if (done) break;

 const chunk =
  decoder.decode(value);

buffer += chunk;

const events =
  buffer.split("\n");

buffer = events.pop();
for (const event of events) {

  let parsed;

try {

  parsed = JSON.parse(event);

} catch {

  continue;

}

  // TOKEN EVENT
  if (parsed.type === "token") {

    setConversations((prev) =>
      prev.map((conv) => {

        if (conv.id === currentChatId) {

          const updatedMessages =
            [...conv.messages];

          const lastMessage =
            updatedMessages[
              updatedMessages.length - 1
            ];

          updatedMessages[
            updatedMessages.length - 1
          ] = {
            ...lastMessage,
            text:
              lastMessage.text +
              parsed.content,
          };

          return {
            ...conv,
            messages: updatedMessages,
          };

        }

        return conv;

      })
    );

  }

  // PRODUCTS EVENT
  if (parsed.type === "products") {

    setConversations((prev) =>
      prev.map((conv) => {

        if (conv.id === currentChatId) {

          const updatedMessages =
            [...conv.messages];

          const lastMessage =
            updatedMessages[
              updatedMessages.length - 1
            ];

          updatedMessages[
            updatedMessages.length - 1
          ] = {
            ...lastMessage,
            products: parsed.items,
          };

          return {
            ...conv,
            messages: updatedMessages,
          };

        }

        return conv;

      })
    );

  }

  // DONE EVENT
  if (parsed.type === "done") {
    setLoading(false);
  }

}
}
setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
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

                  <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                    {msg.text}
                  </ReactMarkdown>
                  {msg.products && msg.products.length > 0 && (

  <div className="product-grid">

    {msg.products.map((product, idx) => (

      <div className="product-card" key={idx}>

        <img
          src={product.thumbnail}
          alt={product.title}
          className="product-image"
        />

        <h3>{product.title}</h3>

        <p><strong>Price:</strong> {product.price}</p>

        <p><strong>Rating:</strong> {product.rating}</p>

        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className="buy-button"
        >
          Buy Now
        </a>

      </div>
    ))}
    {loading && (

  <div className="message bot thinking-message">

    <div className="thinking-dots">

      <span></span>
      <span></span>
      <span></span>

    </div>

  </div>

)}
      <div ref={messagesEndRef} />
  </div>

)}

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