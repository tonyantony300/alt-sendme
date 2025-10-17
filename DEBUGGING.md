# Debugging P2P Connection Issues

## What We Added

I've added comprehensive logging throughout the application to help diagnose the "connection lost" error.

### Logging Points

**Send Side (`src/core/send.rs`):**
- ✅ Node ID and secret key generation
- ✅ Relay mode configuration
- ✅ Endpoint binding and local addresses
- ✅ File import progress
- ✅ Protocol router startup
- ✅ Node address details (before/after applying ticket options)
- ✅ Generated ticket information

**Receive Side (`src/core/receive.rs`):**
- ✅ Ticket parsing
- ✅ Target node information (ID, relay, direct addresses)
- ✅ Endpoint creation and local addresses
- ✅ **Connection attempt with detailed error handling**
- ✅ File size retrieval
- ✅ Download progress (every 1MB)
- ✅ Export process

**Tauri Commands (`src-tauri/src/commands.rs`):**
- ✅ Command entry/exit points
- ✅ Path validation
- ✅ Success/error outcomes

## How to See Logs

### Option 1: Run in Development Mode (Terminal)
```bash
cd web-app
npm run tauri dev
```

**Logs will appear in the terminal where you run this command.**

### Option 2: View Console Logs
- Open the app
- Right-click → Inspect Element → Console tab
- Some logs may appear here

### Option 3: Set Environment Variable for More Detail
```bash
RUST_LOG=debug npm run tauri dev
```

This will show even more detailed logs including trace-level information.

## What to Look For

When you try to receive a file, the logs will show:

### On the Send Side
```
🚀 Starting share for path: /path/to/file
🔑 Node ID: <node_id>
📡 Local addresses: [...]
📍 Node address before options:
  - Node ID: <id>
  - Relay URL: Some("<url>")
  - Direct addresses: [...]
📍 Node address after options:
  - Relay URL: Some("<url>") or None
  - Direct addresses: [...] or []
🎫 Generated ticket: blob...
```

### On the Receive Side
```
🎫 Starting download with ticket: blob...
📍 Target node info:
  - Node ID: <id>
  - Relay URL: Some("<url>") or None
  - Direct addresses: [...]
📡 Local addresses: [...]
🔌 Attempting to connect to sender...
```

**The critical part is here:**
- ✅ If successful: `✅ Connection established successfully!`
- ❌ If failed: `❌ Connection failed: <error details>`

## Common Connection Issues

### 1. **Same Machine Testing**
If you're testing send and receive on the **same machine**, this might cause issues:
- Both endpoints might try to use the same ports
- NAT traversal doesn't apply
- Solution: Test on two different machines or use port forwarding

### 2. **Firewall/NAT Issues**
- The direct addresses might be blocked
- Relay server might be unreachable
- Check the logs for which addresses are being tried

### 3. **Relay Server Configuration**
The ticket type is currently set to `RelayAndAddresses`, which includes:
- Relay URL (should be default Iroh relay)
- Direct IP addresses

**What the logs will tell you:**
```
📍 Node address before options:
  - Relay URL: Some("https://relay.iroh.network")  ← Should see this
  - Direct addresses: [192.168.1.x:xxxx, ...]      ← Should see local IPs
```

### 4. **Ticket Not Including Connection Info**
If you see:
```
🔍 No relay/addresses in ticket, adding DNS discovery
```
This means the ticket doesn't contain relay or direct address info, and DNS discovery is being used instead.

## Next Steps After Running with Logs

1. **Start the app in dev mode** (terminal logs enabled)
2. **Send a file** - note the Node ID and addresses in the logs
3. **Try to receive** - observe where the connection fails
4. **Share the logs** - Copy the relevant log section showing:
   - Send side: Node address, relay URL, direct addresses
   - Receive side: Target info, connection attempt, error details

## Expected Log Flow (Successful)

**Send:**
```
📤 start_sharing command called
🚀 Starting share for path: ...
🔑 Node ID: abc123...
🔧 Relay mode: Default
📡 Local addresses: [192.168.1.100:54321]
📦 Importing files...
✅ Import complete
🌐 Starting protocol router...
✅ Endpoint is online
📍 Node address: relay=https://relay.iroh.network, addrs=[192.168.1.100:54321]
✅ Share started successfully
```

**Receive:**
```
📥 receive_file command called
🎫 Starting download with ticket: blob...
📍 Target node info:
  - Node ID: abc123...
  - Relay URL: Some("https://relay.iroh.network")
  - Direct addresses: [192.168.1.100:54321]
🚀 Creating endpoint...
✅ Endpoint created successfully
📡 Local addresses: [192.168.1.101:54322]
🔌 Attempting to connect to sender...
✅ Connection established successfully!
📊 Getting file sizes...
⬇️  Starting data transfer...
📥 Downloaded: 1000000 bytes
✅ Download complete!
✅ Download operation completed successfully
```

## Testing on Two Different Machines

For best results:
1. **Machine A** (Sender): Run the Tauri app, share a file
2. **Machine B** (Receiver): Run the Tauri app on a different computer/network, paste the ticket
3. The Iroh relay server should facilitate the connection even across different networks

## Still Having Issues?

If connection still fails after checking logs:
1. Try with ticket_type set to different values (in `commands.rs`):
   - `AddrInfoOptions::RelayAndAddresses` (current default)
   - `AddrInfoOptions::Relay` (relay only)
   - `AddrInfoOptions::Id` (uses DNS discovery)
2. Check if the Iroh relay server is accessible
3. Test on two different networks to ensure it's not a local network issue

