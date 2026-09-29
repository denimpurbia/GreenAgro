using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class MascotProcessor {
    public static void Main() {
        string srcPath = @"C:\Users\HP\.gemini\antigravity-ide\brain\c3377249-7020-4bf3-8235-5618333252fb\.user_uploaded\media_1790010116953.jpg";
        string destPath = @"D:\project\AgriN Intelligence Network\apps\web\public\images\agrisaarthi-mascot.png";

        using (Bitmap orig = new Bitmap(srcPath)) {
            int w = orig.Width;
            int h = orig.Height;

            using (Bitmap output = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
                // Lock bits for ultra fast processing
                BitmapData origData = orig.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format24bppRgb);
                BitmapData outData = output.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);

                int origStride = origData.Stride;
                int outStride = outData.Stride;

                byte[] origBytes = new byte[origStride * h];
                byte[] outBytes = new byte[outStride * h];

                System.Runtime.InteropServices.Marshal.Copy(origData.Scan0, origBytes, 0, origBytes.Length);

                // Copy all pixels to output with 255 alpha initially
                for (int y = 0; y < h; y++) {
                    for (int x = 0; x < w; x++) {
                        int oIdx = y * origStride + x * 3;
                        int dIdx = y * outStride + x * 4;

                        byte b = origBytes[oIdx];
                        byte g = origBytes[oIdx + 1];
                        byte r = origBytes[oIdx + 2];

                        outBytes[dIdx] = b;
                        outBytes[dIdx + 1] = g;
                        outBytes[dIdx + 2] = r;
                        outBytes[dIdx + 3] = 255; // full opacity for entire farmer, eyes, face!
                    }
                }

                // Flood fill BFS from outer edges ONLY
                bool[,] visited = new bool[w, h];
                Queue<int> q = new Queue<int>();

                // Check borders
                for (int x = 0; x < w; x++) {
                    int topIdx = 0 * origStride + x * 3;
                    if (origBytes[topIdx] <= 18 && origBytes[topIdx + 1] <= 18 && origBytes[topIdx + 2] <= 18) {
                        visited[x, 0] = true;
                        q.Enqueue((0 << 16) | x);
                    }
                    int botIdx = (h - 1) * origStride + x * 3;
                    if (origBytes[botIdx] <= 18 && origBytes[botIdx + 1] <= 18 && origBytes[botIdx + 2] <= 18) {
                        visited[x, h - 1] = true;
                        q.Enqueue(((h - 1) << 16) | x);
                    }
                }

                for (int y = 0; y < h; y++) {
                    int leftIdx = y * origStride + 0 * 3;
                    if (!visited[0, y] && origBytes[leftIdx] <= 18 && origBytes[leftIdx + 1] <= 18 && origBytes[leftIdx + 2] <= 18) {
                        visited[0, y] = true;
                        q.Enqueue((y << 16) | 0);
                    }
                    int rightIdx = y * origStride + (w - 1) * 3;
                    if (!visited[w - 1, y] && origBytes[rightIdx] <= 18 && origBytes[rightIdx + 1] <= 18 && origBytes[rightIdx + 2] <= 18) {
                        visited[w - 1, y] = true;
                        q.Enqueue((y << 16) | (w - 1));
                    }
                }

                int[] dx = { 1, -1, 0, 0 };
                int[] dy = { 0, 0, 1, -1 };

                while (q.Count > 0) {
                    int cur = q.Dequeue();
                    int cx = cur & 0xFFFF;
                    int cy = cur >> 16;

                    // Set exterior background pixel to transparent
                    int dIdx = cy * outStride + cx * 4;
                    outBytes[dIdx + 3] = 0;

                    for (int i = 0; i < 4; i++) {
                        int nx = cx + dx[i];
                        int ny = cy + dy[i];

                        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                            if (!visited[nx, ny]) {
                                int noIdx = ny * origStride + nx * 3;
                                byte b = origBytes[noIdx];
                                byte g = origBytes[noIdx + 1];
                                byte r = origBytes[noIdx + 2];

                                if (r <= 20 && g <= 20 && b <= 20) {
                                    visited[nx, ny] = true;
                                    q.Enqueue((ny << 16) | nx);
                                } else if (r <= 40 && g <= 40 && b <= 40) {
                                    // Smooth border edge
                                    visited[nx, ny] = true;
                                    int avg = (r + g + b) / 3;
                                    byte alpha = (byte)Math.Min(255, Math.Max(0, (avg - 10) * 255 / 30));
                                    outBytes[ny * outStride + nx * 4 + 3] = alpha;
                                }
                            }
                        }
                    }
                }

                System.Runtime.InteropServices.Marshal.Copy(outBytes, 0, outData.Scan0, outBytes.Length);

                orig.UnlockBits(origData);
                output.UnlockBits(outData);

                output.Save(destPath, ImageFormat.Png);
                Console.WriteLine("Successfully created pristine transparent PNG at " + destPath);
            }
        }
    }
}
