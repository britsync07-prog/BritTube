@echo off
echo ========================================
echo  BritTube MCP Server Setup
echo ========================================
echo.

echo Installing dependencies...
pip install mcp httpx

echo.
echo Setup complete!
echo.
echo To start the MCP server:
echo   python G:/myjob/BritTube/mcp/mcp_server.py --api-key bt_YOUR_KEY
echo.
echo Or set environment variables:
echo   set BRITTUBE_API_KEY=bt_YOUR_KEY
echo   set BRITTUBE_BASE_URL=http://localhost:9090
echo   python G:/myjob/BritTube/mcp/mcp_server.py
echo.
echo Then add this to your AI tool's MCP config:
echo   See config_claude_desktop.json, config_cursor.json, etc.
echo.
pause
