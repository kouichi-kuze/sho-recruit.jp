import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

class VideoCubeIntro {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.cube = null;
        this.animationProgress = 0;
        this.maxHeight = 1200; // 947 → 1200 キューブ全体が見えるように拡張
        this.textAnimationStarted = false;
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 24; // 24fps
        this.imagesLoaded = false; // 画像読み込み完了フラグ
        this.loadingElement = null; // ローディング要素
        this.customRotationAxis = null; // カスタム回転軸（リサイズ時も保持）
        this.customAxisLine = null; // オレンジ色の軸線（リサイズ時も保持）
        this.customAxisSphere1 = null; // オレンジ色の球1（リサイズ時も保持）
        this.customAxisSphere2 = null; // オレンジ色の球2（リサイズ時も保持）
        this.initialCameraState = null; // 初期カメラ状態（リサイズ時も保持）

        this.createLoadingElement();
        this.init();
        this.animate();
    }

    init() {
        // シーン作成
        this.scene = new THREE.Scene();
        this.scene.background = null; // 透過背景

        // 実際の描画サイズを計算
        const canvasWidth = window.innerWidth;
        const canvasHeight = Math.min(window.innerHeight, this.maxHeight);

        // カメラ作成
        this.camera = new THREE.PerspectiveCamera(
            45,
            canvasWidth / canvasHeight,
            0.1,
            5000
        );

        // SP/PC判定
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // SP: キューブが画面に対して丸1.5個分上に表示されるようカメラを配置
            this.camera.position.set(0, 300, 2500); // Y座標を下げることで、被写体が上側に表示される
            this.camera.lookAt(0, 0, 0); // 中心を見る
            this.camera.rotation.z = 0; // Z軸回転なし
        } else {
            // PC: 黄色丸が青丸の位置に見える
            // 黄色(0,0,500)と青(500,0,0)が重なって見えるには45度の角度が必要
            this.camera.position.set(-1768, 450, 1768); // 45度の角度（X=-Z、距離2500維持）
            this.camera.lookAt(0, 0, 0); // 立方体の中心を見る
            this.camera.rotation.z = 0; // Z軸回転なし（地面を水平に保つ）
        }

        // 初期カメラ状態を保存（リサイズ時に復元するため）
        this.initialCameraState = {
            position: this.camera.position.clone(),
            rotation: this.camera.rotation.clone(),
            isMobile: isMobile
        };

        // レンダラー作成（透過背景）
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(canvasWidth, canvasHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // ライト追加
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // ビデオキューブ作成
        this.createVideoCube();

        // デバッグ用: 座標軸を可視化（コメントアウトで非表示）
        // Three.js標準のAxesHelper（XYZ軸線）
        // X軸: 赤, Y軸: 緑, Z軸: 青
        // const axesHelper = new THREE.AxesHelper(1500); // 長さ1500の軸線
        // this.scene.add(axesHelper);

        // より太い軸線を個別に追加
        // X軸（赤）: -1500 → +1500
        // const xLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
        // const xLineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(-1500, 0, 0),
        //     new THREE.Vector3(1500, 0, 0)
        // ]);
        // const xLine = new THREE.Line(xLineGeometry, xLineMaterial);
        // this.scene.add(xLine);

        // Y軸（緑）: -1500 → +1500
        // const yLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
        // const yLineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(0, -1500, 0),
        //     new THREE.Vector3(0, 1500, 0)
        // ]);
        // const yLine = new THREE.Line(yLineGeometry, yLineMaterial);
        // this.scene.add(yLine);

        // Z軸（青）: -1500 → +1500
        // const zLineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 3 });
        // const zLineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(0, 0, -1500),
        //     new THREE.Vector3(0, 0, 1500)
        // ]);
        // const zLine = new THREE.Line(zLineGeometry, zLineMaterial);
        // this.scene.add(zLine);

        // 中心（原点）: 白い球（大きめ）
        // const sphereCenter = new THREE.Mesh(
        //     new THREE.SphereGeometry(80, 32, 32),
        //     new THREE.MeshBasicMaterial({ color: 0xffffff })
        // );
        // sphereCenter.position.set(0, 0, 0);
        // this.scene.add(sphereCenter);

        // X軸方向（右+500）: 赤い球
        // const sphereX = new THREE.Mesh(
        //     new THREE.SphereGeometry(60, 32, 32),
        //     new THREE.MeshBasicMaterial({ color: 0xff0000 })
        // );
        // sphereX.position.set(500, 0, 0);
        // this.scene.add(sphereX);

        // Y軸方向（上+500）: 緑の球
        // const sphereY = new THREE.Mesh(
        //     new THREE.SphereGeometry(60, 32, 32),
        //     new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        // );
        // sphereY.position.set(0, 500, 0);
        // this.scene.add(sphereY);

        // Z軸方向（手前+500）: 青い球
        // const sphereZ = new THREE.Mesh(
        //     new THREE.SphereGeometry(60, 32, 32),
        //     new THREE.MeshBasicMaterial({ color: 0x0000ff })
        // );
        // sphereZ.position.set(0, 0, 500);
        // this.scene.add(sphereZ);

        // X軸マイナス方向（左-500）: 赤暗い球
        // const sphereXMinus = new THREE.Mesh(
        //     new THREE.SphereGeometry(60, 32, 32),
        //     new THREE.MeshBasicMaterial({ color: 0x880000 })
        // );
        // sphereXMinus.position.set(-500, 0, 0);
        // this.scene.add(sphereXMinus);

        // Y軸マイナス方向（下-500）: 緑暗い球
        // const sphereYMinus = new THREE.Mesh(
        //     new THREE.SphereGeometry(60, 32, 32),
        //     new THREE.MeshBasicMaterial({ color: 0x008800 })
        // );
        // sphereYMinus.position.set(0, -500, 0);
        // this.scene.add(sphereYMinus);

        // Z軸マイナス方向（奥-500）: 青暗い球
        // const sphereZMinus = new THREE.Mesh(
        //     new THREE.SphereGeometry(60, 32, 32),
        //     new THREE.MeshBasicMaterial({ color: 0x000088 })
        // );
        // sphereZMinus.position.set(0, 0, -500);
        // this.scene.add(sphereZMinus);

        // グリッドヘルパー（XZ平面）- 地面のグリッド
        // const gridHelper = new THREE.GridHelper(2000, 20, 0x888888, 0x444444);
        // this.scene.add(gridHelper);

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createLoadingElement() {
        // ローディング要素を作成
        this.loadingElement = document.createElement('div');
        this.loadingElement.style.position = 'absolute';
        this.loadingElement.style.top = '50%';
        this.loadingElement.style.left = '50%';
        this.loadingElement.style.transform = 'translate(-50%, -50%)';
        this.loadingElement.style.color = '#274374';
        this.loadingElement.style.fontSize = '16px';
        this.loadingElement.style.fontWeight = 'bold';
        this.loadingElement.style.zIndex = '1000';
        this.loadingElement.textContent = 'Loading...';
        this.container.appendChild(this.loadingElement);
    }

    removeLoadingElement() {
        if (this.loadingElement) {
            this.loadingElement.remove();
            this.loadingElement = null;
        }
    }

    createVideoCube() {
        // キューブグループ作成
        this.cube = new THREE.Group();

        // キューブの角度を細かく調整
        // 立方体の対角線（頂点から頂点）をオレンジ線の軸と一致させる
        // オレンジ軸は後で定義されるので、ここでは初期状態のまま
        // 後でクォータニオンを使って対角線を軸に合わせる

        this.cube.rotation.order = 'XYZ';
        this.cube.rotation.x = 0;
        this.cube.rotation.y = 0;
        this.cube.rotation.z = 0;

        // この回転は後でカスタム軸に合わせて調整される

        // 画像パス
        const imageSources = [
            '/assets/img/top/kv/img1.png', // 右面
            '/assets/img/top/kv/img2.png', // 左面
            '/assets/img/top/kv/img3.png', // 上面
            '/assets/img/top/kv/img4.png', // 下面
            '/assets/img/top/kv/img5.png', // 前面
            '/assets/img/top/kv/img6.png'  // 後面
        ];

        // 各面のテクスチャ回転設定（ラジアン）
        // 前&左：0° (普通の向き)
        // 後ろ&右：180° (逆転)
        // 上：後ろの方に天が来る = -90°
        // 下：左の方に天がくる = 90°
        const textureRotations = [
            Math.PI,      // 右面: 180°
            0,            // 左面: 0°
            -Math.PI / 2, // 上面: -90°
            Math.PI / 2,  // 下面: 90°
            0,            // 前面: 0°
            Math.PI       // 後面: 180°
        ];

        // スマホとPCでサイズを変更
        const isMobile = window.innerWidth < 768;
        const size = isMobile ? 800 : 1300;
        const gap = isMobile ? 15 : 20;
        const offset = (size / 2) + gap;

        // 各面の位置と回転
        const faceConfigs = [
            { position: [offset, 0, 0], rotation: [0, Math.PI / 2, 0] },  // 右
            { position: [-offset, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // 左
            { position: [0, offset, 0], rotation: [-Math.PI / 2, 0, 0] },  // 上
            { position: [0, -offset, 0], rotation: [Math.PI / 2, 0, 0] },  // 下
            { position: [0, 0, offset], rotation: [0, 0, 0] },             // 前
            { position: [0, 0, -offset], rotation: [0, Math.PI, 0] }       // 後
        ];

        // テクスチャローダー
        const textureLoader = new THREE.TextureLoader();

        // 読み込み完了カウント
        let loadedCount = 0;
        const totalImages = 6;

        // 各面を作成
        for (let i = 0; i < 6; i++) {
            // 画像テクスチャを読み込み（コールバック付き）
            const imageTexture = textureLoader.load(
                imageSources[i],
                // 読み込み完了時
                () => {
                    loadedCount++;
                    // 進行度を更新
                    if (this.loadingElement) {
                        this.loadingElement.textContent = `Loading... ${Math.round((loadedCount / totalImages) * 100)}%`;
                    }
                    // 全て読み込み完了
                    if (loadedCount === totalImages) {
                        this.imagesLoaded = true;
                        this.removeLoadingElement();
                    }
                },
                // 進行中（オプション）
                undefined,
                // エラー時
                (error) => {
                    console.error('画像読み込みエラー:', imageSources[i], error);
                }
            );
            imageTexture.minFilter = THREE.LinearFilter;
            imageTexture.magFilter = THREE.LinearFilter;

            // テクスチャを回転
            imageTexture.center.set(0.5, 0.5);
            imageTexture.rotation = textureRotations[i];

            // 通常の平面ジオメトリ（角丸はシェーダーで実装）
            const geometry = new THREE.PlaneGeometry(size, size);

            // カスタムシェーダーマテリアル（角丸 + グレーディング）
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    imageTexture: { value: imageTexture },
                    opacity: { value: 0 },
                    radius: { value: 30 / size }, // 正規化された角丸半径
                    saturation: { value: 0.8 }, // 彩度80%
                    brightness: { value: 0.15 }, // 黒レベル上げ
                    contrast: { value: 0.85 }, // コントラスト下げ
                    maxOpacity: { value: 0.9 } // 最大不透明度90%
                },
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform sampler2D imageTexture;
                    uniform float opacity;
                    uniform float radius;
                    uniform float saturation;
                    uniform float brightness;
                    uniform float contrast;
                    uniform float maxOpacity;
                    varying vec2 vUv;

                    // RGB to HSL
                    vec3 rgb2hsl(vec3 c) {
                        float maxC = max(max(c.r, c.g), c.b);
                        float minC = min(min(c.r, c.g), c.b);
                        float l = (maxC + minC) / 2.0;
                        float h = 0.0;
                        float s = 0.0;

                        if (maxC != minC) {
                            float d = maxC - minC;
                            s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

                            if (maxC == c.r) {
                                h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
                            } else if (maxC == c.g) {
                                h = (c.b - c.r) / d + 2.0;
                            } else {
                                h = (c.r - c.g) / d + 4.0;
                            }
                            h /= 6.0;
                        }

                        return vec3(h, s, l);
                    }

                    // HSL to RGB
                    vec3 hsl2rgb(vec3 c) {
                        vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
                        return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
                    }

                    void main() {
                        vec2 uv = vUv;
                        vec2 pos = uv - 0.5;

                        // 角丸処理
                        vec2 q = abs(pos) - (0.5 - radius);
                        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;

                        if (d > 0.0) discard;

                        vec4 texColor = texture2D(imageTexture, uv);

                        // グレーディング処理
                        vec3 hsl = rgb2hsl(texColor.rgb);
                        hsl.y *= saturation; // 彩度調整
                        vec3 gradedColor = hsl2rgb(hsl);

                        // 黒レベル上げ＆コントラスト下げ
                        gradedColor = (gradedColor - 0.5) * contrast + 0.5 + brightness;
                        gradedColor = clamp(gradedColor, 0.0, 1.0);

                        gl_FragColor = vec4(gradedColor, texColor.a * opacity * maxOpacity);
                    }
                `,
                transparent: true,
                side: THREE.FrontSide // 表面のみ表示（裏面を非表示）
            });

            const plane = new THREE.Mesh(geometry, material);
            plane.position.set(...faceConfigs[i].position);
            plane.rotation.set(...faceConfigs[i].rotation);

            this.cube.add(plane);
        }

        // キューブのローカル座標軸を可視化（コメントアウトで非表示）
        // const cubeAxesHelper = new THREE.AxesHelper(1000); // キューブ用の軸（長さ1000）
        // this.cube.add(cubeAxesHelper); // キューブに追加することで、キューブと一緒に回転する

        // より太いキューブ軸線を追加
        // X軸（赤）: キューブのローカルX軸
        // const cubeXLineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 5 }); // マゼンタ
        // const cubeXLineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(-1000, 0, 0),
        //     new THREE.Vector3(1000, 0, 0)
        // ]);
        // const cubeXLine = new THREE.Line(cubeXLineGeometry, cubeXLineMaterial);
        // this.cube.add(cubeXLine);

        // Y軸（緑）: キューブのローカルY軸
        // const cubeYLineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 5 }); // 黄色
        // const cubeYLineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(0, -1000, 0),
        //     new THREE.Vector3(0, 1000, 0)
        // ]);
        // const cubeYLine = new THREE.Line(cubeYLineGeometry, cubeYLineMaterial);
        // this.cube.add(cubeYLine);

        // Z軸（青）: キューブのローカルZ軸
        // const cubeZLineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 5 }); // シアン
        // const cubeZLineGeometry = new THREE.BufferGeometry().setFromPoints([
        //     new THREE.Vector3(0, 0, -1000),
        //     new THREE.Vector3(0, 0, 1000)
        // ]);
        // const cubeZLine = new THREE.Line(cubeZLineGeometry, cubeZLineMaterial);
        // this.cube.add(cubeZLine);

        // キューブのローカル軸の先端に球体を配置
        // X軸+方向: マゼンタの球
        // const cubeXSphere = new THREE.Mesh(
        //     new THREE.SphereGeometry(50, 16, 16),
        //     new THREE.MeshBasicMaterial({ color: 0xff00ff })
        // );
        // cubeXSphere.position.set(800, 0, 0);
        // this.cube.add(cubeXSphere);

        // Y軸+方向: 黄色の球
        // const cubeYSphere = new THREE.Mesh(
        //     new THREE.SphereGeometry(50, 16, 16),
        //     new THREE.MeshBasicMaterial({ color: 0xffff00 })
        // );
        // cubeYSphere.position.set(0, 800, 0);
        // this.cube.add(cubeYSphere);

        // Z軸+方向: シアンの球
        // const cubeZSphere = new THREE.Mesh(
        //     new THREE.SphereGeometry(50, 16, 16),
        //     new THREE.MeshBasicMaterial({ color: 0x00ffff })
        // );
        // cubeZSphere.position.set(0, 0, 800);
        // this.cube.add(cubeZSphere);

        this.scene.add(this.cube);

        // カスタム回転軸: 地面と平行で10度回転した軸（オレンジ色）
        // シーンに直接配置（キューブとは別）
        // 初回のみ作成、リサイズ時は既存のものを使用
        if (!this.customRotationAxis) {
            // 元の軸 (1, 0, 1) を Y軸周りに10度回転
            const angle = 10 * Math.PI / 180; // 10度をラジアンに変換
            const baseX = 1;
            const baseZ = 1;
            const x = Math.cos(angle) * baseX - Math.sin(angle) * baseZ; // x成分
            const z = Math.sin(angle) * baseX + Math.cos(angle) * baseZ; // z成分
            const customAxisDirection = new THREE.Vector3(x, 0, z).normalize();

            // オレンジ色の線を追加（太い円柱で表現）
            const customAxisGeometry = new THREE.CylinderGeometry(15, 15, 2000, 8);
            const customAxisMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
            this.customAxisLine = new THREE.Mesh(customAxisGeometry, customAxisMaterial);

            // 円柱をカスタム軸の方向に向ける
            // デフォルトのY軸方向から、カスタム軸の方向へ回転
            const quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), customAxisDirection);
            this.customAxisLine.setRotationFromQuaternion(quaternion);

            // カスタム軸の両端にオレンジ色の球を配置
            this.customAxisSphere1 = new THREE.Mesh(
                new THREE.SphereGeometry(50, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xff8800 })
            );
            this.customAxisSphere1.position.copy(customAxisDirection.clone().multiplyScalar(800));

            this.customAxisSphere2 = new THREE.Mesh(
                new THREE.SphereGeometry(50, 16, 16),
                new THREE.MeshBasicMaterial({ color: 0xff8800 })
            );
            this.customAxisSphere2.position.copy(customAxisDirection.clone().multiplyScalar(-800));

            // この軸を後で使用するために保存
            this.customRotationAxis = customAxisDirection;
        }

        // シーンに追加（既に追加されている場合はスキップ）
        // オレンジ軸を非表示にする場合はコメントアウト
        // if (this.customAxisLine && !this.customAxisLine.parent) {
        //     this.scene.add(this.customAxisLine);
        // }
        // if (this.customAxisSphere1 && !this.customAxisSphere1.parent) {
        //     this.scene.add(this.customAxisSphere1);
        // }
        // if (this.customAxisSphere2 && !this.customAxisSphere2.parent) {
        //     this.scene.add(this.customAxisSphere2);
        // }

        // キューブはオレンジ軸と同じ軸で回転する
        // 初期角度は0度のまま（体対角線の設定は不要）
    }

    animate(currentTime) {
        requestAnimationFrame((time) => this.animate(time));

        // 画像読み込み完了まで待機
        if (!this.imagesLoaded) {
            return;
        }

        // 24fpsフレームレート制御
        if (currentTime - this.lastFrameTime < this.frameInterval) {
            return;
        }
        this.lastFrameTime = currentTime - ((currentTime - this.lastFrameTime) % this.frameInterval);

        // アニメーション進行
        if (this.animationProgress < 1) {
            // アニメーション開始時にクラス付与
            if (this.animationProgress === 0) {
                this.container.classList.add('animating');
            }

            // 一定速度でアニメーション
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                this.animationProgress += 0.032;
            } else {
                this.animationProgress += 0.042;
            }
            this.updateAnimation();
        } else if (!this.textAnimationStarted) {
            // アニメーション完了時にクラス削除
            this.container.classList.remove('animating');

            // ズームアウト完了後、少し待ってからテキストアニメーション開始
            this.textAnimationStarted = true;
            setTimeout(() => {
                this.startTextAnimation();
            }, 150); // 500ms遅延
        }

        // カスタム軸（オレンジ色の軸）を中心に回転（15秒で360° = 2π rad）
        // 24fps * 15秒 = 360フレーム
        // 1フレームあたり: 2π / 360 = 0.01745 rad
        const rotationSpeed = 0.01745;

        // 任意の軸を中心に逆回転（Three.jsのrotateOnAxis）
        if (this.customRotationAxis) {
            this.cube.rotateOnAxis(this.customRotationAxis, -rotationSpeed);
        }

        this.renderer.render(this.scene, this.camera);
    }

    updateAnimation() {
        // フェードインとズームアウトを0から同時開始（イージング付き）
        const fadeProgress = this.easeInOutSine(Math.min(this.animationProgress / 0.2, 1)); // 0-20%でフェードイン（イージング付き）
        this.cube.children.forEach(child => {
            // AxesHelperを除外して、プレーンのみopacityを更新
            if (child.material && child.material.uniforms && child.material.uniforms.opacity) {
                child.material.uniforms.opacity.value = fadeProgress;
            }
        });

        // カメラは固定位置から常に中心を見る
        // 位置は初期化時に設定済み（y: -647, z: 2415）
        this.camera.lookAt(0, 0, 0);

        // ズームアウト・移動も0から開始（境界なし）
        if (this.animationProgress >= 0) {
            const moveProgress = this.animationProgress;
            const easedProgress = this.easeInOutSine(moveProgress); // 最も滑らかなサインカーブ

            // kv-bgをフェードイン
            const kvBg = document.querySelector('.kv-bg');
            if (kvBg) {
                kvBg.style.opacity = easedProgress;
            }

            // スマホとPCでサイズを変更（より大きな動きに）
            const isMobile = window.innerWidth < 768;
            const startSize = isMobile ? 800 : 1300;
            const endSize = isMobile ? 550 : 900; // より大きな縮小幅
            const currentSize = startSize + (endSize - startSize) * easedProgress;
            this.cube.scale.set(
                currentSize / startSize,
                currentSize / startSize,
                currentSize / startSize
            );

            // 3点を通る曲線で移動（2次ベジェ曲線）
            // SP/PC判定でベジェ曲線のポイントを設定
            let P0, P1, P2;

            if (isMobile) {
                P0 = { x: 0, y: 0, z: 500 };        // 始点
                P1 = { x: -400, y: -200, z: 0 };     // 中間点（制御点）
                P2 = { x: 0, y: 320, z: -300 };       // 終点
            } else {
                P0 = { x: 0, y: 0, z: 600 };        // 始点
                P1 = { x: -900, y: -600, z: 0 };     // 中間点（制御点）
                P2 = { x: 300, y: 0, z: -1000 };       // 終点
            }

            const t = easedProgress; // 0 to 1

            // 2次ベジェ曲線: B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
            const oneMinusT = 1 - t;
            const term0 = oneMinusT * oneMinusT;
            const term1 = 2 * oneMinusT * t;
            const term2 = t * t;

            this.cube.position.x = term0 * P0.x + term1 * P1.x + term2 * P2.x;
            this.cube.position.y = term0 * P0.y + term1 * P1.y + term2 * P2.y;
            this.cube.position.z = term0 * P0.z + term1 * P1.z + term2 * P2.z;
        }
    }

    // イージング関数
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    easeOutQuad(t) {
        return t * (2 - t);
    }

    easeInQuad(t) {
        return t * t; // はじめゆっくり、後半早く
    }

    // ベジェイージング（曲線的な動き）
    // 制御点: P0(0,0), P1(0.25,0.1), P2(0.25,1), P3(1,1)
    easeBezier(t) {
        // cubic-bezier(0.25, 0.1, 0.25, 1) の近似
        return t * t * (3 - 2 * t); // smoothstep
    }

    // より強いベジェカーブ（停止時にイーズイン）
    easeInOutBezier(t) {
        // cubic-bezier(0.42, 0, 0.58, 1.0) の近似
        if (t < 0.5) {
            return 2 * t * t;
        } else {
            return -1 + (4 - 2 * t) * t;
        }
    }

    // オーバーシュート付きイージング（左側に膨らむ動き）
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    // サインカーブイージング（最も滑らかな加速・減速）
    easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }

    startTextAnimation() {
        const copy1 = document.querySelector('.kv-copy1');
        const copy2 = document.querySelector('.kv-copy2');

        if (!copy1 || !copy2) return;

        // copy1のマスクアニメーション（左から右へ）
        copy1.style.clipPath = 'inset(0 100% 0 0)';
        copy1.style.opacity = '1';

        // copy1アニメーション
        let copy1Progress = 0;
        const copy1Interval = setInterval(() => {
            copy1Progress += 0.03;
            if (copy1Progress >= 1) {
                copy1Progress = 1;
                clearInterval(copy1Interval);

                // copy1完了後、copy2を開始
                setTimeout(() => {
                    copy2.style.clipPath = 'inset(0 100% 0 0)';
                    copy2.style.opacity = '1';

                    let copy2Progress = 0;
                    const copy2Interval = setInterval(() => {
                        copy2Progress += 0.03;
                        if (copy2Progress >= 1) {
                            copy2Progress = 1;
                            clearInterval(copy2Interval);

                            // copy2完了後、青い帯とテキストアニメーション開始
                            setTimeout(() => {
                                this.startReadAnimation();
                            }, 300);
                        }
                        const easedProgress = this.easeOutQuad(copy2Progress);
                        const inset = (1 - easedProgress) * 100;
                        copy2.style.clipPath = `inset(0 ${inset}% 0 0)`;
                    }, 16);
                }, 100); // 200ms待機
            }
            const easedProgress = this.easeOutQuad(copy1Progress);
            const inset = (1 - easedProgress) * 100;
            copy1.style.clipPath = `inset(0 ${inset}% 0 0)`;
        }, 16);
    }

    startReadAnimation() {
        const kvReadSpans = document.querySelectorAll('.kv-read p span');

        if (!kvReadSpans || kvReadSpans.length === 0) return;

        // 各spanを順番にアニメーション
        this.animateSpan(kvReadSpans, 0);
    }

    animateSpan(spans, index) {
        if (index >= spans.length) {
            // 全てのspanのアニメーションが完了したら、ヘッダーとボタンを表示
            this.showHeaderAndButton();
            return;
        }

        const currentSpan = spans[index];

        // spanを表示準備（まず表示してサイズを取得）
        currentSpan.style.position = 'relative';
        currentSpan.style.display = 'inline-block';
        currentSpan.style.opacity = '1';

        // サイズを取得
        const spanWidth = currentSpan.offsetWidth;
        const spanHeight = currentSpan.offsetHeight;

        console.log('Animating span:', index, 'width:', spanWidth, 'height:', spanHeight);

        // テキストを一旦隠す（clip-pathで）
        currentSpan.style.clipPath = 'inset(0 100% 0 0)';

        // グラデーションマスクを親要素に追加
        const maskContainer = currentSpan.parentElement;
        const spanRect = currentSpan.getBoundingClientRect();
        const containerRect = maskContainer.getBoundingClientRect();

        const mask = document.createElement('div');
        mask.style.position = 'absolute';
        mask.style.top = (spanRect.top - containerRect.top) + 'px';
        mask.style.left = (spanRect.left - containerRect.left) + 'px';
        mask.style.width = '0';
        mask.style.height = spanHeight + 'px';
        mask.style.backgroundImage = 'linear-gradient(60deg, rgb(3, 35, 48) 0%, rgb(35, 78, 110) 49%, rgb(35, 78, 110) 100%)';
        mask.style.pointerEvents = 'none';
        mask.style.zIndex = '100';
        maskContainer.appendChild(mask);

        // フェーズ1: グラデーション帯が左起点で0%→100%に伸びる
        let phase1Progress = 0;
        const maskStartLeft = spanRect.left - containerRect.left;

        const phase1Interval = setInterval(() => {
            phase1Progress += 0.045; // 0.03 * 1.5 = 0.045
            if (phase1Progress >= 1) {
                phase1Progress = 1;
                clearInterval(phase1Interval);

                // フェーズ2: 帯が右起点で100%→0%に縮みながらテキストが表示される
                setTimeout(() => {
                    let phase2Progress = 0;
                    const phase2Interval = setInterval(() => {
                        phase2Progress += 0.045; // 0.03 * 1.5 = 0.045
                        if (phase2Progress >= 1) {
                            phase2Progress = 1;
                            clearInterval(phase2Interval);
                            // アニメーション完了後、マスクを削除
                            mask.remove();
                            currentSpan.style.clipPath = 'none';

                            // 次のspanをアニメーション（少し遅延）
                            setTimeout(() => {
                                this.animateSpan(spans, index + 1);
                            }, 100);
                        }
                        const easedProgress = this.easeOutQuad(phase2Progress);

                        // 帯が右起点で縮む（左位置が右へ移動、幅が減る）
                        mask.style.left = `${maskStartLeft + (spanWidth * easedProgress)}px`;
                        mask.style.width = `${spanWidth * (1 - easedProgress)}px`;

                        // テキストが左から表示される
                        currentSpan.style.clipPath = `inset(0 ${100 - (easedProgress * 100)}% 0 0)`;
                    }, 16);
                }, 50);
            }
            const easedProgress = this.easeOutQuad(phase1Progress);
            // 帯が左起点で伸びる（左位置は固定、幅が増える）
            mask.style.left = `${maskStartLeft}px`;
            mask.style.width = `${spanWidth * easedProgress}px`;
        }, 16);
    }

    showHeaderAndButton() {
        const siteHeader = document.querySelector('.site-header');
        const fixedBtn = document.querySelector('.fixed-btn-link');
        const kvScroll = document.querySelector('.kv-scroll');

        // 1. ヘッダーをスライドイン
        if (siteHeader) {
            siteHeader.style.transition = 'transform 0.6s ease-out';
            siteHeader.style.transform = 'translateY(0)';
        }

        // 2. ヘッダー完了後、固定ボタンをスライドイン
        setTimeout(() => {
            if (fixedBtn) {
                fixedBtn.style.transition = 'transform 0.6s ease-out';
                fixedBtn.style.transform = 'translateX(0)';
            }
        }, 600);

        // 3. ボタン完了後、スクロール要素をフェードイン
        setTimeout(() => {
            if (kvScroll) {
                kvScroll.style.transition = 'opacity 0.6s ease-out';
                kvScroll.style.opacity = '1';
            }
        }, 1200);
    }

    onWindowResize() {
        const canvasWidth = window.innerWidth;
        const isMobile = window.innerWidth < 768;

        // PCの場合は初期の高さを維持、SPの場合は可変
        let canvasHeight;
        if (isMobile) {
            canvasHeight = Math.min(window.innerHeight, this.maxHeight);
        } else {
            // PCの場合は初期カメラ状態から高さを取得（固定）
            if (this.initialCameraState && !this.initialCameraState.isMobile) {
                // 初期設定時の高さを維持
                canvasHeight = this.maxHeight;
            } else {
                canvasHeight = Math.min(window.innerHeight, this.maxHeight);
            }
        }

        // 初期カメラ状態を維持（位置・回転は変更しない）
        // アスペクト比とレンダラーサイズのみ更新
        this.camera.aspect = canvasWidth / canvasHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvasWidth, canvasHeight);
    }
}

// 初期化
new VideoCubeIntro();
