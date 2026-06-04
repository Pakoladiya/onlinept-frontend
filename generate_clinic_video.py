import asyncio
from pipelines.idea2video_pipeline import Idea2VideoPipeline


# SET YOUR OWN IDEA, USER REQUIREMENT, AND STYLE HERE
idea = \
"""
A modern physiotherapy clinic in urban India, featuring warm lighting and traditional Indian decor elements like brass lamps and marble accents. The clinic has multiple treatment rooms with state-of-the-art equipment including massage tables, ultrasound machines, treadmills, resistance bands, and exercise bikes. Indian physiotherapists in white coats and namaste scarves guide patients through sessions. Show diverse Indian patients - a young athlete recovering from injury, an elderly woman doing gentle exercises, and a middle-aged man receiving manual therapy. The video starts with an exterior shot of the clinic sign in Hindi and English, then pans inside to bustling reception, treatment rooms, and group therapy sessions, ending with a satisfied patient smiling at the camera while a therapist demonstrates proper form on equipment.
"""

user_requirement = \
"""
For promotional purposes, limit to 3 scenes: clinic exterior and entrance, main treatment area with equipment, and patient interaction with staff. Each scene should have no more than 5 shots. Keep the tone professional and reassuring, emphasizing care and modern facilities.
"""

style = "Realistic, warm and inviting feel with natural lighting"


async def main():
    pipeline = Idea2VideoPipeline.init_from_config(
        config_path="configs/idea2video.yaml")
    await pipeline(idea=idea, user_requirement=user_requirement, style=style)

if __name__ == "__main__":
    asyncio.run(main())