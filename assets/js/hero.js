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
        this.camera.position.z = 2500; // 2000 → 2500に変更（キューブ全体が見えるように）

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

        // ウィンドウリサイズ対応
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createVideoCube() {
        // キューブグループ作成
        this.cube = new THREE.Group();

        // 画像パス
        const imageSources = [
            '/assets/img/top/kv/img1.png', // 右面
            '/assets/img/top/kv/img2.png', // 左面
            '/assets/img/top/kv/img3.png', // 上面
            '/assets/img/top/kv/img4.png', // 下面
            '/assets/img/top/kv/img5.png', // 前面
            '/assets/img/top/kv/img6.png'  // 後面
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

        // 各面を作成
        for (let i = 0; i < 6; i++) {
            // 画像テクスチャを読み込み
            const imageTexture = textureLoader.load(imageSources[i]);
            imageTexture.minFilter = THREE.LinearFilter;
            imageTexture.magFilter = THREE.LinearFilter;

            // 通常の平面ジオメトリ（角丸はシェーダーで実装）
            const geometry = new THREE.PlaneGeometry(size, size);

            // カスタムシェーダーマテリアル（角丸）
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    imageTexture: { value: imageTexture },
                    opacity: { value: 0 },
                    radius: { value: 30 / size } // 正規化された角丸半径
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
                    varying vec2 vUv;

                    void main() {
                        vec2 uv = vUv;
                        vec2 pos = uv - 0.5;

                        // 角丸処理
                        vec2 q = abs(pos) - (0.5 - radius);
                        float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;

                        if (d > 0.0) discard;

                        vec4 texColor = texture2D(imageTexture, uv);
                        gl_FragColor = vec4(texColor.rgb, texColor.a * opacity);
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

        this.scene.add(this.cube);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // アニメーション進行
        if (this.animationProgress < 1) {
            this.animationProgress += 0.016; // 0.01 → 0.025 ズームアウト速度をさらに上げる
            this.updateAnimation();
        } else if (!this.textAnimationStarted) {
            // ズームアウト完了後、少し待ってからテキストアニメーション開始
            this.textAnimationStarted = true;
            setTimeout(() => {
                this.startTextAnimation();
            }, 150); // 500ms遅延
        }

        // キューブを回転（速度調整）
        let rotationSpeedY = 0.003;
        let rotationSpeedX = 0.001;

        if (this.animationProgress <= 0.3) {
            // フェードイン時: 速い回転
            rotationSpeedY = 0.012;
            rotationSpeedX = 0.004;
        } else {
            // ズームアウト時（0.3以降）: 徐々に減速してゆっくりに
            const zoomProgress = (this.animationProgress - 0.3) / 0.7;
            // 0.012 から 0.005 へ徐々に減速
            rotationSpeedY = 0.012 - (0.007 * zoomProgress);
            rotationSpeedX = 0.004 - (0.002 * zoomProgress);
        }

        this.cube.rotation.y += rotationSpeedY;
        this.cube.rotation.x += rotationSpeedX;

        this.renderer.render(this.scene, this.camera);
    }

    updateAnimation() {
        // フェードイン（0-0.3の範囲）
        if (this.animationProgress <= 0.3) {
            const fadeProgress = this.animationProgress / 0.3;
            this.cube.children.forEach(plane => {
                plane.material.uniforms.opacity.value = fadeProgress;
            });
        } else {
            // フェードイン完了後は完全に不透明
            this.cube.children.forEach(plane => {
                plane.material.uniforms.opacity.value = 1;
            });
        }

        // 0.3以降でズームアウト・移動開始（回転表示期間をカット）
        if (this.animationProgress > 0.3) {
            const moveProgress = (this.animationProgress - 0.3) / 0.7;
            const easedProgress = this.easeInQuad(moveProgress); // はじめゆっくり、後半早く

            // kv-bgをフェードイン
            const kvBg = document.querySelector('.kv-bg');
            if (kvBg) {
                kvBg.style.opacity = easedProgress;
            }

            // スマホとPCでサイズを変更
            const isMobile = window.innerWidth < 768;
            const startSize = isMobile ? 800 : 1300;
            const endSize = isMobile ? 600 : 960; // 500 → 600 (1.2倍), 800 → 960 (1.2倍)
            const currentSize = startSize + (endSize - startSize) * easedProgress;
            this.cube.scale.set(
                currentSize / startSize,
                currentSize / startSize,
                currentSize / startSize
            );

            // Y位置: SPは20px、PCは30px上に移動
            const targetY = isMobile ? 300 : 30;
            this.cube.position.y = targetY * easedProgress;

            // 位置移動: PC(768px以上)のみ左側へ移動、SPは中央のまま
            if (window.innerWidth >= 768) {
                const targetX = -250 * (this.camera.position.z / 1000); // z=2500なので約-625
                this.cube.position.x = targetX * easedProgress;
            }
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
        const canvasHeight = Math.min(window.innerHeight, this.maxHeight);

        this.camera.aspect = canvasWidth / canvasHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvasWidth, canvasHeight);
    }
}

// 初期化
new VideoCubeIntro();
