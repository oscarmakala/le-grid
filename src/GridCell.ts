import { WidgetBase } from '@dojo/widget-core/WidgetBase';
import { WidgetProperties } from '@dojo/widget-core/interfaces';
import { v } from '@dojo/widget-core/d';
import { ThemeableMixinInterface, ThemeableMixin, ThemeableProperties, theme } from '@dojo/widget-core/mixins/Themeable';
import { DNode } from '@dojo/widget-core/interfaces';

import * as css from './styles/gridCell.css';

export interface GridCellProperties extends WidgetProperties, ThemeableProperties {
	data: any;
	renderer?: Function;
}

@theme(css)
export default class GridCell extends ThemeableMixin(WidgetBase)<GridCellProperties> implements ThemeableMixinInterface {
	render(): DNode {
		const { properties: { data, renderer } } = this;
		const value = renderer ? renderer(data) : data;
		return v('td', { classes: this.classes(css.cell).get() }, [ value ? value.toString() : null ]);
	}
}
