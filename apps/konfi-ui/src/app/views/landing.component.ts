import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Card } from 'primeng/card';
import {ButtonDirective} from 'primeng/button';

@Component({
  selector: 'app-landing',
  imports: [
    CommonModule,
    Card,
    RouterLink,
    ButtonDirective,
  ],
  template: `
    <div class="landing-container">
      <div class="landing-content">
        <div class="landing-header">
          <h1 class="landing-title">Welcome to KonfiUi</h1>
          <p class="landing-subtitle">Choose how you'd like to get started</p>
        </div>

        <div class="options-grid">
          <p-card class="option-card brunch-option">
            <div class="option-content">
              <i class="pi pi-star-fill option-icon"></i>
              <h3 class="option-title">Create Brunch</h3>
              <p class="option-description">
                Create a full-featured brunch voting table with advanced options,
                passwords, and detailed configuration.
              </p>
              <button
                pButton
                class="option-button brunch-button"
                routerLink="/brunch/create"
                label="Create Brunch"
                icon="pi pi-arrow-right"
                iconPos="right">
              </button>
            </div>
          </p-card>

          <p-card class="option-card table-option">
            <div class="option-content">
              <i class="pi pi-table option-icon"></i>
              <h3 class="option-title">Create Table</h3>
              <p class="option-description">
                Quick and simple table creation for basic voting needs.
                Perfect for quick polls and simple decisions.
              </p>
              <button
                pButton
                class="option-button table-button"
                routerLink="/table/create"
                label="Create Table"
                icon="pi pi-arrow-right"
                iconPos="right">
              </button>
            </div>
          </p-card>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .landing-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem 0;
      display: flex;
      align-items: center;
      min-height: calc(100vh - 2rem);
    }

    .landing-content {
      width: 100%;
      animation: slideUp 0.8s ease-out;
    }

    .landing-header {
      text-align: center;
      margin-bottom: 3rem;
      color: white;
    }

    .landing-title {
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .landing-subtitle {
      font-size: 1.3rem;
      opacity: 0.9;
      margin: 0;
      font-weight: 400;
    }

    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .option-card {
      border-radius: 20px;
      border: none;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      transition: all 0.4s ease;
      overflow: hidden;
      height: 100%;
    }

    .option-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 30px 80px rgba(0,0,0,0.2);
    }

    .option-card .p-card-body {
      padding: 0;
      height: 100%;
    }

    .option-content {
      padding: 2.5rem;
      text-align: center;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .option-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
    }

    .brunch-option .option-icon {
      color: #667eea;
    }

    .table-option .option-icon {
      color: #764ba2;
    }

    .option-title {
      font-size: 1.8rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .option-description {
      color: #6c757d;
      font-size: 1rem;
      line-height: 1.6;
      margin: 0 0 2rem 0;
      flex-grow: 1;
      display: flex;
      align-items: center;
    }

    .option-button {
      width: 100%;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 12px;
      transition: all 0.3s ease;
      border: none;
    }

    .brunch-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .brunch-button:hover {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .table-button {
      background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      color: white;
    }

    .table-button:hover {
      background: linear-gradient(135deg, #6a4190 0%, #5a6fd8 100%);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(118, 75, 162, 0.3);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      :host {
        padding: 0.5rem;
      }

      .landing-container {
        padding: 1rem 0;
        min-height: calc(100vh - 1rem);
      }

      .landing-title {
        font-size: 2.5rem;
      }

      .landing-subtitle {
        font-size: 1.1rem;
      }

      .options-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      .option-content {
        padding: 2rem;
      }

      .option-icon {
        font-size: 2.5rem;
      }

      .option-title {
        font-size: 1.5rem;
      }

      .option-description {
        font-size: 0.95rem;
      }
    }

    @media (max-width: 480px) {
      .landing-title {
        font-size: 2rem;
      }

      .landing-header {
        margin-bottom: 2rem;
      }

      .option-content {
        padding: 1.5rem;
      }

      .option-icon {
        font-size: 2rem;
      }

      .option-title {
        font-size: 1.3rem;
      }
    }

    /* Animations */
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* PrimeNG Button Overrides */
    .p-button {
      justify-content: center;
    }

    .p-button .p-button-icon {
      margin-left: 0.5rem;
    }
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
}
