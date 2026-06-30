window.addEventListener('DOMContentLoaded', () => {
    logMessage("UI Loaded. Initializing bridging layers...", "system");
    initCTraderPlugin();
});

function logMessage(text, type = "system") {
    const logWindow = document.getElementById('activity-log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerText = `[${new Date().toLocaleTimeString()}] ${text}`;
    logWindow.appendChild(entry);
    logWindow.scrollTop = logWindow.scrollHeight; // Auto-scroll to latest
}

async function initCTraderPlugin() {
    // Check if the global object from the cTrader Plugin SDK is present
    if (typeof ctrader !== 'undefined' && ctrader.plugin) {
        logMessage("Connected to cTrader Engine successfully.", "success");
        
        try {
            // 1. Initial Account Load
            const account = await ctrader.plugin.getAccountInformation();
            updateUI(account);

            // 2. Event Listener: Stream active account balance adjustments
            ctrader.plugin.on('accountChanged', (updatedAccount) => {
                updateUI(updatedAccount);
                logMessage(`Account updated. Balance: $${updatedAccount.balance}`, "system");
            });

            // 3. Event Listener: Watch for position executions and tracking triggers
            ctrader.plugin.on('executionEvent', (event) => {
                logMessage(`Position Event: ${event.executionType} | Symbol: ${event.symbolName}`, "trade");
            });

            // 4. Setup Input Command Listeners
            document.getElementById('execute-btn').addEventListener('click', () => {
                handleCommand(document.getElementById('terminal-input').value);
            });

        } catch (err) {
            logMessage(`Initialization error: ${err.message}`, "error");
        }
    } else {
        logMessage("Running in standalone sandbox mode. Platform features simulated.", "system");
        setupSandboxTesting();
    }
}

function updateUI(accountData) {
    document.getElementById('balance-display').innerText = `$${accountData.balance.toFixed(2)}`;
    document.getElementById('positions-count').innerText = accountData.positionsCount || "0";
}

// Text Command Parsing Processor
async function handleCommand(rawInput) {
    const input = rawInput.trim().toLowerCase();
    if (!input) return;

    logMessage(`Executing console directive: "${input}"`, "system");
    document.getElementById('terminal-input').value = ""; // Clear line

    const parts = input.split(" ");
    const command = parts[0];

    try {
        if (command === "buy" || command === "sell") {
            const volume = parts[1] ? parseFloat(parts[1]) : 0.01;
            logMessage(`Sending market execution order: ${command.toUpperCase()} ${volume} lots`, "trade");
            
            // Native cTrader API calling interface
            if (typeof ctrader !== 'undefined') {
                await ctrader.plugin.placesMarketOrder({
                    tradeType: command === "buy" ? "Buy" : "Sell",
                    volume: volume
                });
            }
        } else if (command === "closeall") {
            logMessage("Command received: Closing all current market exposures...", "trade");
            // Call bulk execution handling layers if hooked natively
        } else {
            logMessage(`Unrecognized directive context: "${command}"`, "error");
        }
    } catch (err) {
        logMessage(`Execution failed: ${err.message}`, "error");
    }
}

// Fallback Mock Interface for Mobile Browser testing
function setupSandboxTesting() {
    updateUI({ balance: 10540.70, positionsCount: 2 });
    document.getElementById('execute-btn').addEventListener('click', () => {
        handleCommand(document.getElementById('terminal-input').value);
    });
}
