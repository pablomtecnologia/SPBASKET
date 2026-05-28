import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../components/page-header/page-header';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  sizes: string[]; // ['S', 'M', 'L', 'XL', '2XL'] or [] for accessories
  category: 'kit' | 'merch';
  description: string;
  allowName?: boolean;
  allowNumber?: boolean;
}

interface CartItem {
  product: Product;
  size: string;
  quantity: number;
  customName?: string;
  customNumber?: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  private apiUrl = environment.apiUrl;

  products: Product[] = [
    {
      id: 'kit-rosa-completo',
      name: 'Equipación Rosa (Juego Completo)',
      price: 40,
      images: [
        'assets/images/products/kit-rosa-completo-new.jpg'
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'kit',
      description: 'Camiseta y pantalón oficial SP Basket Rosa. Diseño exclusivo "Zebra Wave".',
      allowName: true,
      allowNumber: true
    },
    {
      id: 'equipacion-5-aniversario',
      name: 'Equipación Juego SPBasket 5º Aniversario Negra y Dorada',
      price: 40,
      images: ['assets/images/products/equipacion-5-aniversario.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'kit',
      description: 'Edición especial 5º Aniversario. Negra y Dorada.',
      allowNumber: true,
      allowName: true
    },
    {
      id: 'camiseta-rosa',
      name: 'Camiseta de Juego Rosa',
      price: 25,
      images: ['assets/images/products/kit-rosa-jersey-front.jpg', 'assets/images/products/kit-rosa-jersey-back.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'kit',
      description: 'Solo la camiseta de juego rosa. Tejido transpirable alta competición.',
      allowName: true,
      allowNumber: true
    },
    {
      id: 'pantalon-rosa',
      name: 'Pantalón de Juego Rosa',
      price: 20,
      images: ['assets/images/products/pantalon-rosa-new.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'kit',
      description: 'Pantalón corto de juego rosa a juego con la camiseta.',
      allowNumber: true
    },
    {
      id: 'pantalon-negro',
      name: 'Pantalón de Juego Negro',
      price: 20,
      images: ['assets/images/products/pantalon-negro-new.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'kit',
      description: 'Pantalón corto de juego negro con detalles dorados.',
      allowNumber: true
    },
    {
      id: 'cubre-calentamiento',
      name: 'Cubre Calentamiento SPBasket 5º Aniversario',
      price: 25,
      images: ['assets/images/products/cubre-calentamiento.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'kit',
      description: 'Cubre de calentamiento edición 5º Aniversario. Negro y Dorado.',
      allowNumber: true,
      allowName: true
    },
    {
      id: 'sudadera-blanca',
      name: 'Sudadera SPBasket Blanca',
      price: 36,
      images: ['assets/images/products/sudadera-blanca.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'merch',
      description: 'Sudadera oficial blanca con capucha y logo.'
    },
    {
      id: 'sudadera-negra',
      name: 'Sudadera SPBasket Negra',
      price: 36,
      images: ['assets/images/products/sudadera-negra.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'merch',
      description: 'Sudadera oficial negra con capucha y logo.'
    },
    {
      id: 'parka-sp',
      name: 'Parka SP Basket',
      price: 55,
      images: ['assets/images/shop/parka-new.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'merch',
      description: 'Parka oficial negra con capucha y logo bordado.',
      allowName: true
    },
    {
      id: 'mochila-sp',
      name: 'Mochila SP Basket',
      price: 40,
      images: ['assets/images/shop/mochila-new.jpg'],
      sizes: ['Única'],
      category: 'merch',
      description: 'Mochila oficial con compartimento para zapatillas y balón.',
      allowNumber: true
    },
    {
      id: 'gorra-sp',
      name: 'Gorra SP Basket',
      price: 15,
      images: ['assets/images/products/gorra-sp.jpg'],
      sizes: ['Única'],
      category: 'merch',
      description: 'Gorra oficial del club. Talla ajustable.'
    },
    {
      id: 'camiseta-solidaria',
      name: 'Camiseta Solidaria I Torneo Inclusivo-2026',
      price: 10,
      images: ['assets/images/products/camiseta-solidaria.jpg'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
      category: 'merch',
      description: 'Camiseta solidaria del I Torneo Inclusivo-2026.'
    }
  ];

  cart: CartItem[] = [];
  isCartOpen = false;

  // Quick Add State
  selectedSize: { [productId: string]: string } = {};

  // Customization inputs storage
  customNames: { [key: string]: string } = {};
  customNumbers: { [key: string]: string } = {};

  // Checkout Form
  customerName = '';
  customerPhone = '';
  customerMessage = '';

  loading = false;

  // For dropdown
  availableNumbers: number[] = Array.from({ length: 100 }, (_, i) => i);

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { }

  ngOnInit() {
    this.auth.currentUser.subscribe((user: any) => {
      if (user) {
        this.customerName = `${user.nombre_completo || user.username || ''}`.trim();
      }
    });

    // Load cart from local storage
    const savedCart = localStorage.getItem('sp_cart');
    if (savedCart) {
      this.cart = JSON.parse(savedCart);
    }
  }

  // --- CART ACTIONS ---
  addToCart(product: Product) {
    const size = this.selectedSize[product.id] || (product.sizes.length === 1 ? product.sizes[0] : null);

    if (product.sizes.length > 1 && !size) {
      alert('⚠️ Por favor selecciona una talla primero.');
      return;
    }

    const finalSize = size || 'Única';
    const cName = this.customNames[product.id] || '';
    const cNum = this.customNumbers[product.id] || '';

    // Validate if customization is required? Let's keep it optional but recommended in UI.

    // Find exact item match (including customizations)
    const existingItem = this.cart.find(item =>
      item.product.id === product.id &&
      item.size === finalSize &&
      item.customName === cName &&
      item.customNumber === cNum
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        product: product,
        size: finalSize,
        quantity: 1,
        customName: cName,
        customNumber: cNum
      });
    }

    this.saveCart();
    this.openCart(); // Show cart when adding

    // Clear inputs after adding? Optional.
    // this.customNames[product.id] = '';
    // this.customNumbers[product.id] = '';
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
    this.saveCart();
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  saveCart() {
    localStorage.setItem('sp_cart', JSON.stringify(this.cart));
  }

  getTotal(): number {
    return this.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  }

  // --- UI ACTIONS ---
  openCart() { this.isCartOpen = true; }
  closeCart() { this.isCartOpen = false; }

  selectSize(productId: string, size: string) {
    this.selectedSize[productId] = size;
  }

  submitReservation() {
    if (this.cart.length === 0) return;

    if (!this.customerName || !this.customerPhone) {
      alert('⚠️ Por favor completa tu nombre y teléfono para poder contactarte.');
      return;
    }

    this.loading = true;

    const payload = {
      cart: this.cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        size: item.size,
        quantity: item.quantity,
        customName: item.customName,
        customNumber: item.customNumber
      })),
      contact: {
        name: this.customerName || 'Anónimo',
        phone: this.customerPhone,
        message: this.customerMessage
      }
    };

    this.http.post(`${this.apiUrl}/products/reserve`, payload).subscribe({
      next: (res: any) => {
        alert('✅ ¡Reserva enviada con éxito! Te contactaremos pronto por WhatsApp/Teléfono para el pago.');
        this.clearCart();
        this.closeCart();
        this.loading = false;
        this.customerMessage = '';
      },
      error: (err) => {
        console.error('Error reserving:', err);
        alert('❌ Hubo un error al enviar la reserva. Por favor inténtalo de nuevo.');
        this.loading = false;
      }
    });
  }

}
