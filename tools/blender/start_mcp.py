"""Enable the Blender MCP addon and start its server (same as the sidebar "Connect" button).

Usage: /Applications/Blender.app/Contents/MacOS/Blender --python tools/blender/start_mcp.py
"""

import bpy, addon_utils

def start():
    try:
        addon_utils.enable("addon", default_set=False, persistent=False)
        scene = bpy.context.scene
        scene.blendermcp_use_polyhaven = True
        bpy.ops.blendermcp.start_server()
        print("MCP_STARTED", scene.blendermcp_server_running)
    except Exception as e:
        print("MCP_START_FAILED", repr(e))
    return None

bpy.app.timers.register(start, first_interval=2.0)
