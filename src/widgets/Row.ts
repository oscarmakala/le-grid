import WidgetBase from '@dojo/widget-core/WidgetBase';
import { v, w } from '@dojo/widget-core/d';
import { DNode } from '@dojo/widget-core/interfaces';
import ThemedMixin, { theme } from '@dojo/widget-core/mixins/Themed';

import { ColumnConfig } from './../interfaces';
import Cell from './Cell';
import * as css from './styles/Row.m.css';

export interface RowProperties {
	id: number;
	item: { [index: string]: any };
	columnConfig: ColumnConfig[];
	updater: (rowNumber: number, columnId: string, value: any) => void;
}

@theme(css)
export default class Row extends ThemedMixin(WidgetBase)<RowProperties> {
	protected render(): DNode {
		const { item, columnConfig, id } = this.properties;
		let columns = columnConfig.map(
			(config) => {
				let value: string | DNode = `${item[config.id]}`;
				if (config.renderer) {
					value = config.renderer({ value });
				}
				return w(Cell, {
					key: config.id,
					updater: (updatedValue: string) => {
						this.properties.updater(id, config.id, updatedValue);
					},
					value,
					editable: config.editable,
					rawValue: `${item[config.id]}`
				});
			},
			[] as DNode[]
		);

		return v('div', { classes: css.root, role: 'row' }, columns);
	}
}
