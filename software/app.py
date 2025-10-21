import cv2
import torch
import time
from ultralytics import YOLO
from collections import deque, Counter
from mqtt1 import send_log, close  # 👈 add this

def main():
    model = YOLO("best.pt")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    model.to(device)

    video_path = video_path = "testVideos/animalMove1.mp4"

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video file {video_path}")
        return

    detect_conf = 0.5
    log_conf = 0.8
    skip_rate = 2
    confirm_window = 8
    last_log_time = 0
    last_logged_objects = set()
    detection_history = deque(maxlen=confirm_window)

    print("Starting YOLO + ByteTrack tracking… (press 'q' to quit)")
    cv2.namedWindow("YOLOv8 + ByteTrack", cv2.WINDOW_NORMAL)
    cv2.setWindowProperty("YOLOv8 + ByteTrack", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if int(cap.get(cv2.CAP_PROP_POS_FRAMES)) % skip_rate != 0:
            continue

        results = model.track(
            frame,
            conf=detect_conf,
            persist=True,
            tracker="bytetrack_custom.yaml",
            imgsz=640,
            half=(device == "cuda"),
            verbose=False
        )

        annotated = results[0].plot()
        cv2.imshow("YOLOv8 + ByteTrack", annotated)

        detected_objects = set()
        if results and results[0].boxes.id is not None:
            boxes = results[0].boxes
            for i in range(len(boxes)):
                conf = float(boxes.conf[i])
                cls = int(boxes.cls[i])
                obj_name = results[0].names[cls]
                track_id = int(boxes.id[i])

                if conf >= log_conf:
                    detected_objects.add(f"{obj_name}_{track_id}")

        detection_history.append(detected_objects)

        current_time = time.time()
        if current_time - last_log_time >= 1 and detection_history:
            all_objs = [obj for frame_set in detection_history for obj in frame_set]
            counts = Counter(all_objs)
            stable_objs = {obj for obj, c in counts.items() if c >= len(detection_history)//3}

            if stable_objs != last_logged_objects:
                object_names = sorted([obj.split("_")[0] for obj in stable_objs])
                log_msg = f"Change! : {object_names}"
                print(log_msg)
                send_log(log_msg)  # 👈 send through MQTT
                last_logged_objects = stable_objs

            last_log_time = current_time

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    close()  # 👈 gracefully close MQTT
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
