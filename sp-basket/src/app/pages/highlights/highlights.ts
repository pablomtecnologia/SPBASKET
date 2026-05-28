import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Highlight {
    id: number;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    team: string;
    category: string;
    date: string;
    views: number;
    likes: number;
    duration: string;
    isFeatured: boolean;
    playerName?: string;
    matchScore?: string;
}

@Component({
    selector: 'app-highlights',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './highlights.html',
    styleUrls: ['./highlights.css']
})
export class HighlightsComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('particlesCanvas') particlesCanvas!: ElementRef<HTMLCanvasElement>;

    highlights: Highlight[] = [];
    filteredHighlights: Highlight[] = [];
    featuredHighlight: Highlight | null = null;
    activeFilter: string = 'all';
    activeVideoId: number | null = null;
    isLoading = true;
    animatedStats = { videos: 0, views: 0, likes: 0 };
    targetStats = { videos: 47, views: 125400, likes: 8920 };

    private animFrameId: number | null = null;
    private statsAnimated = false;
    private observer: IntersectionObserver | null = null;

    categories = [
        { id: 'all', label: 'TODOS', icon: '🔥' },
        { id: 'sp-rosa', label: 'SP ROSA', icon: '🩷' },
        { id: 'sp-negro', label: 'SP NEGRO', icon: '🖤' },
        { id: 'dunks', label: 'MATES', icon: '🏀' },
        { id: 'buzzer', label: 'BUZZER BEATERS', icon: '⏱️' },
        { id: 'blocks', label: 'TAPONES', icon: '🛡️' },
        { id: 'assists', label: 'ASISTENCIAS', icon: '🎯' },
    ];

    ngOnInit() {
        this.loadHighlights();
        setTimeout(() => {
            this.isLoading = false;
        }, 1500);
    }

    ngAfterViewInit() {
        this.initParticles();
        this.initStatsObserver();
        this.initScrollAnimations();
    }

    ngOnDestroy() {
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    loadHighlights() {
        // Demo data - en producción vendrá del backend
        this.highlights = [
            {
                id: 1,
                title: 'TRIPLE DECISIVO EN EL ÚLTIMO SEGUNDO',
                description: 'Un triple increíble desde la esquina que selló la victoria en los últimos 3 segundos del partido.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop',
                team: 'sp-rosa',
                category: 'buzzer',
                date: '2026-02-28',
                views: 15200,
                likes: 1340,
                duration: '0:45',
                isFeatured: true,
                playerName: 'Jugador MVP',
                matchScore: 'SP Rosa 78 - 76 Rival'
            },
            {
                id: 2,
                title: 'MATE BRUTAL EN CONTRAATAQUE',
                description: 'Contraataque perfecto que termina con un mate espectacular a una mano.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=600&h=400&fit=crop',
                team: 'sp-negro',
                category: 'dunks',
                date: '2026-02-25',
                views: 12800,
                likes: 980,
                duration: '0:32',
                isFeatured: false,
                playerName: 'Jugador Estrella',
                matchScore: 'SP Negro 85 - 70 Rival'
            },
            {
                id: 3,
                title: 'TAPÓN IMPOSIBLE + CONTRAATAQUE',
                description: 'Tapón en el aro que inicia un contraataque letal terminado en canasta.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=600&h=400&fit=crop',
                team: 'sp-rosa',
                category: 'blocks',
                date: '2026-02-20',
                views: 9500,
                likes: 720,
                duration: '0:28',
                isFeatured: false,
                matchScore: 'SP Rosa 92 - 81 Rival'
            },
            {
                id: 4,
                title: 'ASISTENCIA NO-LOOK DE ESPALDAS',
                description: 'Pase de espaldas sin mirar que deja al compañero solo bajo el aro.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&h=400&fit=crop',
                team: 'sp-negro',
                category: 'assists',
                date: '2026-02-18',
                views: 8200,
                likes: 650,
                duration: '0:22',
                isFeatured: false,
                matchScore: 'SP Negro 88 - 82 Rival'
            },
            {
                id: 5,
                title: 'CROSSOVER + TRIPLE DESDE 3 METROS',
                description: 'Crossover devastador seguido de un triple muy lejano con el reloj acabando.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=600&h=400&fit=crop',
                team: 'sp-rosa',
                category: 'buzzer',
                date: '2026-02-15',
                views: 11300,
                likes: 890,
                duration: '0:38',
                isFeatured: false,
                matchScore: 'SP Rosa 67 - 65 Rival'
            },
            {
                id: 6,
                title: 'ALLEY-OOP ESPECTACULAR',
                description: 'Conexión aérea perfecta entre base y ala-pívot para un alley-oop memorable.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1559692048-79a3f837883d?w=600&h=400&fit=crop',
                team: 'sp-negro',
                category: 'dunks',
                date: '2026-02-12',
                views: 14100,
                likes: 1100,
                duration: '0:25',
                isFeatured: false,
                matchScore: 'SP Negro 95 - 88 Rival'
            },
            {
                id: 7,
                title: 'ROBO + COAST TO COAST',
                description: 'Robo de balón en defensa y carrera solitaria hasta el aro contrario.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=600&h=400&fit=crop',
                team: 'sp-rosa',
                category: 'blocks',
                date: '2026-02-10',
                views: 7600,
                likes: 540,
                duration: '0:35',
                isFeatured: false,
                matchScore: 'SP Rosa 71 - 68 Rival'
            },
            {
                id: 8,
                title: 'PASE ALLEY-OOP EN TRANSICIÓN',
                description: 'Pase largo de toda la cancha que conecta con el compañero cortando al aro.',
                videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                thumbnailUrl: 'https://images.unsplash.com/photo-1577471488278-16eec37ffcc2?w=600&h=400&fit=crop',
                team: 'sp-negro',
                category: 'assists',
                date: '2026-02-08',
                views: 6900,
                likes: 480,
                duration: '0:30',
                isFeatured: false,
                matchScore: 'SP Negro 80 - 75 Rival'
            },
        ];

        this.featuredHighlight = this.highlights.find(h => h.isFeatured) || this.highlights[0];
        this.filteredHighlights = [...this.highlights];
    }

    filterHighlights(category: string) {
        this.activeFilter = category;
        this.activeVideoId = null;

        if (category === 'all') {
            this.filteredHighlights = [...this.highlights];
        } else {
            this.filteredHighlights = this.highlights.filter(
                h => h.team === category || h.category === category
            );
        }
    }

    playVideo(id: number) {
        this.activeVideoId = this.activeVideoId === id ? null : id;
    }

    formatViews(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('es-ES', options);
    }

    getTeamBadgeClass(team: string): string {
        return team === 'sp-rosa' ? 'badge-rosa' : 'badge-negro';
    }

    getTeamName(team: string): string {
        return team === 'sp-rosa' ? 'SP ROSA' : 'SP NEGRO';
    }

    private initParticles() {
        if (!this.particlesCanvas) return;
        const canvas = this.particlesCanvas.nativeElement;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = 600;

        const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
        const colors = ['#E6007E', '#FF1A94', '#FF6BB5', '#ffffff', '#C0006A'];

        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 3 + 1,
                alpha: Math.random() * 0.6 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            // Draw connections
            particles.forEach((p1, i) => {
                particles.slice(i + 1).forEach(p2 => {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = '#E6007E';
                        ctx.globalAlpha = 0.08 * (1 - dist / 120);
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                });
            });

            this.animFrameId = requestAnimationFrame(animate);
        };

        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = 600;
        });
    }

    private initStatsObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.statsAnimated) {
                    this.statsAnimated = true;
                    this.animateStats();
                }
            });
        }, { threshold: 0.5 });

        setTimeout(() => {
            const statsEl = document.querySelector('.stats-section');
            if (statsEl) this.observer!.observe(statsEl);
        }, 100);
    }

    private animateStats() {
        const duration = 2000;
        const startTime = performance.now();

        const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutQuart(progress);

            this.animatedStats = {
                videos: Math.round(eased * this.targetStats.videos),
                views: Math.round(eased * this.targetStats.views),
                likes: Math.round(eased * this.targetStats.likes),
            };

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }

    private initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        setTimeout(() => {
            document.querySelectorAll('.scroll-reveal').forEach(el => {
                observer.observe(el);
            });
        }, 200);
    }
}
