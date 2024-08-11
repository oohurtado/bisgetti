import { Component, OnInit } from '@angular/core';
import { MenuResponse } from '../../../../../source/models/business/responses/menu-response';
import { MenuStuffResponse } from '../../../../../source/models/business/responses/menu-stuff-response';
import { CategoryResponse } from '../../../../../source/models/business/responses/category-response';
import { MenuElement } from '../../../../../source/models/business/menu-element';
import { ProductResponse } from '../../../../../source/models/business/responses/product-response';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuStuffService } from '../../../../../services/business/menu-stuff.service';
import { Tuple2 } from '../../../../../source/models/common/tuple';
import * as lodash from 'lodash';
import { Utils } from '../../../../../source/utils';
import { MenuHelper } from '../../../../../source/menu-helper';
declare let alertify: any;

@Component({
    selector: 'app-menus-preview',
    templateUrl: './menus-preview.component.html',
    styleUrl: './menus-preview.component.css'
})
export class MenusPreviewComponent implements OnInit {
    _error: string | null = null;
    _isProcessing: boolean = false;

    _menuHelper: MenuHelper | null = null;

    _menuId!: number | null;
    _menu!: MenuResponse | null;
    _menuStuff!: MenuStuffResponse[] | null;
    _categories!: CategoryResponse[] | null;
    _products!: ProductResponse[] | null;
    _data: MenuElement[];

    _elementsAvaialable!: Tuple2<number,string>[]; // id element, text element // para usar en modal, pueden ser categorias o productos que aun no se estan usando, y pueden ser asignados
    _elementClicked!: MenuElement;

    _openModal_addElementToElement: boolean = false;
    _openModal_removeElementFromElement: boolean = false;
    _openModal_updateElementSettings: boolean = false;
    _openModal_updateElementImage: boolean = false;
    
    constructor(
        private menuStuffService: MenuStuffService,
        private activatedRoute: ActivatedRoute,
        private router: Router
    ) {
        this._menuId = null;
        this._menu = null;
        this._menuStuff = [];
        this._categories = [];
        this._products = [];
        this._data = [];
    }

    async ngOnInit() {
        alertify.set('notifier','position', 'top-right');
        await this.setUrlParametersAsync();
    }

    async setUrlParametersAsync() {
        this.activatedRoute.params.subscribe(async params => {
            this._menuId = params['id'];
            if (this._menuId !== null && this._menuId !== undefined) {
                await this.getDataAsync();
            }
        });
    }

    async getDataAsync() {
        this._isProcessing = true;
        await Promise.all(
            [
                this.menuStuffService.getMenuAsync(this._menuId ?? 0), 
                this.menuStuffService.getCategoriesAsync(), 
                this.menuStuffService.getProductsAsync(),
                this.menuStuffService.getMenuStuffAsync(this._menuId ?? 0)
            ])
            .then(r => {
                let menu = r[0] as MenuResponse;
                let categories = r[1] as CategoryResponse[];
                let products = r[2] as ProductResponse[]; 
                let menuStuff = r[3] as MenuStuffResponse[];

                this._menuHelper?.setData(this._menuId, menu, categories, products, menuStuff);
                this._data = this._menuHelper?.buildMenu() ?? [];                                       
            }, e => {
                this._error = Utils.getErrorsResponse(e);
                alertify.error(this._error, 1)
                this.router.navigateByUrl('menu-stuff/menus/list');
            });
        this._isProcessing = false;        
    }  

    getMenu() : MenuElement | null {
        return this._menuHelper!.getMenu();
    }

    getCategories() : MenuElement[] | undefined {
        return this._menuHelper!.getCategories();
    }

    getProducts(categoryId: number) : MenuElement[] | undefined {
        return this._menuHelper?.getProducts(categoryId);
    }

    onElementClicked(event: Event) {
        alertify.message('Agregando al carrito...')
    }
}
