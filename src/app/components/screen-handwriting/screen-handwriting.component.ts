import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

@Component({
  selector: 'app-screen-handwriting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './screen-handwriting.component.html',
  styleUrls: ['./screen-handwriting.component.scss']
})
export class ScreenHandwritingComponent implements AfterViewInit {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasElement!: ElementRef<HTMLCanvasElement>;

  title = 'Hand Tracking Drawing';
  isDrawing = false;
  isErasing = false;
  isCameraActive = false;
  stream: MediaStream | null = null;

  // MediaPipe Hands相关变量
  hands: any;
  camera: any;
  lastPoint: { x: number, y: number } | null = null;

  // 新增轨迹存储数组[5](@ref)
  private drawingPath: {x: number, y: number, isErasing: boolean}[] = [];

  // 新增状态变量（握拳检测）
  private isFist = false;

  ngAfterViewInit() {
    this.loadMediaPipeScripts();
  }

  // 加载MediaPipe所需脚本
  loadMediaPipeScripts() {
    const scriptHands = document.createElement('script');
    scriptHands.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
    scriptHands.onload = () => this.initializeMediaPipeHands();
    document.head.appendChild(scriptHands);

    const scriptCamera = document.createElement('script');
    scriptCamera.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js';
    document.head.appendChild(scriptCamera);

    const scriptDrawing = document.createElement('script');
    scriptDrawing.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js';
    document.head.appendChild(scriptDrawing);
  }

  // 初始化MediaPipe Hands
  initializeMediaPipeHands() {
    this.hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.hands.onResults(this.onHandResults.bind(this));
  }

  // 处理手部检测结果
  onHandResults(results: any) {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d')!;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 重绘所有存储的路径[5](@ref)
    this.redrawStoredPath(ctx);

    if (results.multiHandLandmarks) {
      for (const landmarks of results.multiHandLandmarks) {
        // 绘制手部关键点和连接线
        window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 2
        });
        window.drawLandmarks(ctx, landmarks, {
          color: '#FF0000',
          lineWidth: 1,
          radius: 3
        });

        // 获取食指指尖位置（索引8）和手腕位置（索引0）[7,9](@ref)
        const indexFingerTip = landmarks[8];
        const wrist = landmarks[0];

        // 解决镜像问题：水平翻转x坐标[5,8](@ref)
        const x = canvas.width - (indexFingerTip.x * canvas.width);
        const y = indexFingerTip.y * canvas.height;

        // 计算食指指尖与手腕的距离（归一化距离）[7,9](@ref)
        const distX = indexFingerTip.x - wrist.x;
        const distY = indexFingerTip.y - wrist.y;
        const distance = Math.sqrt(distX * distX + distY * distY);

        // 握拳检测（距离阈值0.05）[7](@ref)
        if (distance < 0.05) {
          if (!this.isFist) {
            this.isFist = true;
            this.isDrawing = false; // 握拳时停止绘制
          }
        } else if (this.isFist) {
          this.isFist = false;
          this.isDrawing = true; // 松开时恢复绘制
        }

        // 绘制当前光标
        ctx.beginPath();
        ctx.arc(x, y, this.isErasing ? 20 : 8, 0, Math.PI * 2);
        ctx.fillStyle = this.isErasing ? '#FF0000' : '#3498db';
        ctx.fill();
        ctx.closePath();

        // 实时绘制
        if (this.isDrawing && !this.isFist) {
          this.drawingPath.push({x, y, isErasing: this.isErasing});

          // 绘制线条
          if (this.lastPoint) {
            ctx.beginPath();
            ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
            ctx.lineTo(x, y);
            ctx.strokeStyle = this.isErasing ? 'rgba(255, 0, 0, 0.2)' : '#3498db';
            ctx.lineWidth = this.isErasing ? 40 : 10;
            ctx.lineCap = 'round'; // 平滑线条[5](@ref)
            ctx.lineJoin = 'round'; // 平滑连接点[5](@ref)
            ctx.stroke();
          }
          this.lastPoint = {x, y};
        } else {
          this.lastPoint = null;
        }
      }
    }
  }

  // 重绘所有存储的路径[5](@ref)
  private redrawStoredPath(ctx: CanvasRenderingContext2D) {
    if (this.drawingPath.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(this.drawingPath[0].x, this.drawingPath[0].y);

    for (let i = 1; i < this.drawingPath.length; i++) {
      const point = this.drawingPath[i];
      const prevPoint = this.drawingPath[i - 1];

      // 设置线条样式（根据点的状态）
      ctx.strokeStyle = point.isErasing
        ? 'rgba(255, 0, 0, 0.2)'
        : '#3498db';
      ctx.lineWidth = point.isErasing ? 40 : 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 绘制线段
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  }

  // 启动摄像头
  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });

      // 镜像视频显示（用户友好）[5](@ref)
      this.videoElement.nativeElement.style.transform = "scaleX(-1)";
      this.videoElement.nativeElement.srcObject = this.stream;
      this.isCameraActive = true;

      // 初始化摄像头
      this.camera = new window.Camera(this.videoElement.nativeElement, {
        onFrame: async () => {
          await this.hands.send({ image: this.videoElement.nativeElement });
        },
        width: 640,
        height: 480
      });

      this.camera.start();
    } catch (err) {
      console.error('摄像头访问失败:', err);
      alert('无法访问摄像头，请确保已授予权限');
    }
  }

  // 停止摄像头
  stopCamera() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.isCameraActive = false;
    this.videoElement.nativeElement.style.transform = ""; // 重置镜像
  }

  // 清除画布
  clearCanvas() {
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawingPath = []; // 清空路径存储[5](@ref)
  }

  // 切换绘图模式
  toggleDrawing() {
    this.isDrawing = !this.isDrawing;
    this.isErasing = false;
  }

  // 切换橡皮擦模式
  toggleEraser() {
    this.isErasing = !this.isErasing;
    this.isDrawing = true; // 自动进入绘图模式
  }
}
