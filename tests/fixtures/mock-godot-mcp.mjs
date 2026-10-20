// Test fixture for our manually-approved Godot MCP inspection client.
// Does not execute Godot or interact with the user's projects.
import readline from 'node:readline';
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on('line', line => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.id === 1 && msg.method === 'initialize') {
    console.log(JSON.stringify({ jsonrpc: '2.0', id: 1, result: {
      protocolVersion: msg.params.protocolVersion,
      capabilities: { tools: {} },
      serverInfo: { name: 'mock-godot-mcp', version: '0.0.0' }
    } }));
  } else if (msg.id === 2 && msg.method === 'tools/call') {
    const name = msg.params.name;
    const argument = msg.params.arguments || {};
    const text = name === 'get_godot_version'
      ? 'Godot Engine v4.4.mock'
      : name === 'get_project_info'
        ? 'Mock project: ' + argument.projectPath
        : 'denied';
    console.log(JSON.stringify({ jsonrpc: '2.0', id: 2, result: {
      content: [{ type: 'text', text }],
      isError: name !== 'get_godot_version' && name !== 'get_project_info'
    } }));
  }
});
