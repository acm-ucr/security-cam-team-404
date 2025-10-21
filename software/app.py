import cv2
import torch
import time
from ultralytics import YOLO
from collections import deque, Counter

def main():
    # Load model
    model = YOLO("best.pt")

    # Select device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")
    model.to(device)

    # Path to your test video
    video_path = 0
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video file {video_path}")
        return

    # Parameters
    detect_conf = 0.5          # lower → more forgiving detection
    log_conf = 0.87            # higher → only log strong detections
    skip_rate = 2
    confirm_window = 8         # frames used for stability
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

        # Run detection + tracking
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

        # Collect detections
        detected_objects = set()
        if results and results[0].boxes.id is not None:
            boxes = results[0].boxes
            for i in range(len(boxes)):
                conf = float(boxes.conf[i])
                cls = int(boxes.cls[i])
                obj_name = results[0].names[cls]
                track_id = int(boxes.id[i])

                # keep track always, but only log if high-conf
                if conf >= log_conf:
                    detected_objects.add(f"{obj_name}_{track_id}")

        detection_history.append(detected_objects)

        # Smooth detection history (soft persistence)
        current_time = time.time()
        if current_time - last_log_time >= 1 and detection_history:
            all_objs = [obj for frame_set in detection_history for obj in frame_set]
            counts = Counter(all_objs)
            stable_objs = {obj for obj, c in counts.items() if c >= len(detection_history)//3}

            if stable_objs != last_logged_objects:
                object_names = sorted([obj.split("_")[0] for obj in stable_objs])
                print(f"[{time.strftime('%H:%M:%S')}] Confirmed objects ≥{log_conf}: {object_names}")
                last_logged_objects = stable_objs

            last_log_time = current_time

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
