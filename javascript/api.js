document.addEventListener("DOMContentLoaded", function () {
    const chatForm = document.getElementById("chat-form");
    const userInput = document.getElementById("user-input");
    const chatMessages = document.getElementById("chat-messages");
    const loadingIndicator = document.getElementById("loading-indicator");
    const resetButton = document.getElementById("reset-chat-button");
    const OLLAMA_API_URL = "http://localhost:11434/api/chat";

    let conversationHistory = [];

    function appendMessage(sender, text) {
        const messageElement = document.createElement("div");
        messageElement.className = `message ${sender.toLowerCase()}-message`;

        const senderElement = document.createElement("strong");
        senderElement.textContent = sender + ": ";

        const textElement = document.createElement("span");

        const formattedText = formatCodeBlocks(text);
        textElement.innerHTML = formattedText;

        messageElement.appendChild(senderElement);
        messageElement.appendChild(textElement);

        chatMessages.appendChild(messageElement);

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chatForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const userMessage = userInput.value.trim();
        if (!userMessage) return;

        appendMessage("User", userMessage);
        userInput.value = "";
        userInput.focus();

        loadingIndicator.style.display = "block";

        try {
            conversationHistory.push({
                role: "user",
                content: userMessage,
            });

            const messages = [{ role: "system" }, ...conversationHistory];

            const requestData = {
                model: "llama3.2:3b",
                messages: messages,
                stream: false,
            };

            const response = await fetch(OLLAMA_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();

            conversationHistory.push({
                role: "assistant",
                content: data.message.content,
            });

            appendMessage("Assistant", data.message.content);

            saveConversationHistory();
        } catch (error) {
            console.error(
                "Erreur lors de la communication avec Ollama:",
                error
            );
            appendMessage(
                "Système",
                "Désolé, une erreur est survenue lors de la communication avec l'IA."
            );
        } finally {
            loadingIndicator.style.display = "none";
        }
    });

    function formatCodeBlocks(text) {
        const formattedText = text.replace(
            /```([a-z]*)\n([\s\S]*?)\n```/g,
            function (match, language, code) {
                return `<pre><code class="language-${language}">${escapeHTML(
                    code
                )}</code></pre>`;
            }
        );

        return formattedText.replace(/`([^`]+)`/g, "<code>$1</code>");
    }

    function escapeHTML(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function resetConversation() {
        conversationHistory = [];
        chatMessages.innerHTML = "";
        appendMessage("Système", "Nouvelle conversation démarrée.");
        saveConversationHistory();
    }

    function saveConversationHistory() {
        localStorage.setItem(
            "conversationHistory",
            JSON.stringify(conversationHistory)
        );
    }

    function loadConversationHistory() {
        const savedHistory = localStorage.getItem("conversationHistory");
        if (savedHistory) {
            conversationHistory = JSON.parse(savedHistory);
            chatMessages.innerHTML = "";
            conversationHistory.forEach((message) => {
                const sender = message.role === "user" ? "User" : "Assistant";
                appendMessage(sender, message.content);
            });
        } else {
            appendMessage(
                "Système",
                "Bienvenue ! Posez votre première question à l'IA."
            );
        }
    }

    loadConversationHistory();

    if (resetButton) {
        resetButton.addEventListener("click", resetConversation);
    }
});
