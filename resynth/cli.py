import sys
import argparse
import json
import os
import subprocess
from resynth.gateway import MultiLLMGateway
from resynth.apk_inspector import APKInspector
from resynth.web_inspector import WebInspector

def main():
    parser = argparse.ArgumentParser(
        description="RE-Synth: Autonomous Reverse-Engineering & Code Synthesis Engine (By Abhijeet kangane)"
    )
    subparsers = parser.add_subparsers(dest="command")

    # Command: inspect
    inspect_parser = subparsers.add_parser("inspect", help="Inspect an APK or website")
    inspect_parser.add_argument("target", help="URL or path to APK/binary")

    # Command: synthesize
    synth_parser = subparsers.add_parser("synthesize", help="Synthesize code based on prompt and extracted spec")
    synth_parser.add_argument("--spec", help="Path to extracted JSON spec", default=None)
    synth_parser.add_argument("--prompt", required=True, help="User customization prompt")
    synth_parser.add_argument("--tier", default="synthesis", choices=["fast_classifier", "large_context", "synthesis"])

    # Command: play
    subparsers.add_parser("play", help="Launch the reconstructed er.driving game")

    args = parser.parse_args()

    if args.command == "inspect":
        target = args.target
        if target.startswith("http://") or target.startswith("https://"):
            print(f"[RE-Synth] Inspecting Web Target: {target}...")
            spec = WebInspector.inspect_url(target)
        elif target.endswith(".apk"):
            print(f"[RE-Synth] Inspecting Mobile APK: {target}...")
            spec = APKInspector.inspect(target)
        else:
            print(f"[RE-Synth] Unknown target format. Assuming binary / directory: {target}")
            spec = {"target": target, "status": "unsupported_binary_format"}

        print(json.dumps(spec, indent=2))

    elif args.command == "synthesize":
        print(f"[RE-Synth] Initiating Multi-LLM Synthesis...")
        print(f"User Directive: {args.prompt}")
        gateway = MultiLLMGateway()

        system_prompt = (
            "You are the RE-Synth Code Synthesis Engine created for Abhijeet kangane. "
            "Your objective is to generate clean-room production code matching the user's modifications."
        )

        result = gateway.route_task(args.prompt, system_instruction=system_prompt, tier=args.tier)
        print(json.dumps(result, indent=2))

    elif args.command == "play":
        print("[RE-Synth] Launching ER.DRIVING (Crafted by Abhijeet kangane)...")
        subprocess.run(["npm", "run", "dev"], shell=True)

    else:
        parser.print_help()

if __name__ == "__main__":
    main()

