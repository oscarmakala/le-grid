import { VNodeProperties } from '@dojo/interfaces/vdom';
import { Widget, WidgetMixin, WidgetProperties, WidgetFactory, DNode, PropertiesChangeEvent } from '@dojo/widget-core/interfaces';
import createWidgetBase from '@dojo/widget-core/createWidgetBase';
import { includes } from '@dojo/shim/array';
import createSort from '@dojo/stores/query/createSort';
import { w } from '@dojo/widget-core/d';
import { QueryTransformMixin } from '@dojo/stores/store/mixins/createQueryTransformMixin';
import storeMixin from '@dojo/widget-core/mixins/storeMixin';
import FactoryRegistry from '@dojo/widget-core/FactoryRegistry';

import createBody from './createBody';
import createRow from './createRow';
import createRowView from './createRowView';
import createCell from './createCell';
import createHeader from './createHeader';
import createHeaderCell from './createHeaderCell';
import createFooter from './createFooter';

function createRegistry(props: any) {
	const { customCell } = props;
	const registry = new FactoryRegistry();
	registry.define('dgrid-body', createBody);
	registry.define('dgrid-row', createRow);
	registry.define('dgrid-row-view', createRowView);
	registry.define('dgrid-cell', customCell || createCell);
	registry.define('dgrid-header', createHeader);
	registry.define('dgrid-header-cell', createHeaderCell);
	registry.define('dgrid-footer', createFooter);
	return registry;
}

export interface Column {
	id: string;
	label: string;
	field?: string;
	sortable?: boolean;
	color?: string;
	renderer?: (value: string) => string;
}

export interface SortDetails {
	columnId: string;
	descending: boolean;
}

export interface PaginationDetails {
	dataRangeStart: number;
	dataRangeCount: number;
	pageNumber: number;
}

export interface PaginatedProperties {
	itemsPerPage: number;
}

export interface DgridProperties extends WidgetProperties {
	columns: Column[];
	store: QueryTransformMixin<{}, any>;
	customCell?: any;
	pagination?: PaginatedProperties;
}

export interface DgridMixin extends WidgetMixin<DgridProperties> {
	onSortRequest(this: DgridMixin, columnId: string, descending: boolean): void;
	onPaginationRequest(this: DgridMixin, pageNumber: string): void;
}

export type Dgrid = DgridMixin & Widget<DgridProperties>

export interface DgridFactory extends WidgetFactory<Dgrid, DgridProperties> { }

interface InternalState {
	store: QueryTransformMixin<{}, any>;
	sortDetails?: SortDetails;
	paginationDetails?: PaginationDetails;
}

const internalStateMap = new WeakMap<Dgrid, InternalState>();

const defaultPaginationDetails: PaginationDetails  = {
	dataRangeStart: 0,
	dataRangeCount: 10,
	pageNumber: 1
};

const createDgrid: DgridFactory = createWidgetBase
	.mixin(storeMixin)
	.mixin({
		mixin: {
			classes: ['dgrid-widgets', 'dgrid', 'dgrid-grid'],
			nodeAttributes: [
				function(this: Dgrid, attributes: VNodeProperties): VNodeProperties {
					return { role: 'grid' };
				}
			],
			onSortRequest(this: Dgrid, columnId: string, descending: boolean): void {
				const { pagination, store } = <DgridProperties> this.properties;
				const internalState = internalStateMap.get(this);

				internalState.store = store.sort(createSort([ columnId ], [ descending ]));

				if (pagination) {
					const { paginationDetails: { dataRangeStart, dataRangeCount } = defaultPaginationDetails } = internalState;
					internalState.store = internalState.store.range(dataRangeStart, dataRangeCount);
				}

				internalState.sortDetails = { columnId, descending };
				this.invalidate();
			},
			onPaginationRequest(this: Dgrid, pageNumber: string): void {
				const { pagination: { itemsPerPage = 10 } = { }, store } = <DgridProperties> this.properties;
				const internalState = internalStateMap.get(this);
				const dataRangeStart = (parseInt(pageNumber, 10) - 1) * itemsPerPage;

				if (internalState.sortDetails) {
					internalState.store = store
						.sort(createSort(internalState.sortDetails.columnId, internalState.sortDetails.descending))
						.range(dataRangeStart, itemsPerPage);
				}
				else {
					internalState.store = store.range(dataRangeStart, itemsPerPage);
				}

				internalState.paginationDetails = { dataRangeStart, dataRangeCount: itemsPerPage, pageNumber: parseInt(pageNumber, 10)};
				this.invalidate();
			},
			getChildrenNodes(this: Dgrid): DNode[] {
				const { state = [], properties: { columns, pagination }, registry } = this;
				const { paginationDetails, sortDetails, store } = internalStateMap.get(this);

				return [
					w('dgrid-header', { registry, onSortRequest: this.onSortRequest.bind(this), sortDetails, columns } ),
					w('dgrid-body', { registry, store, columns } ),
					w('dgrid-footer', { onPaginationRequest: this.onPaginationRequest.bind(this), totalCount: state.length, paginationDetails, pagination: Boolean(pagination) } )
				];
			}
		},
		initialize(instance: Dgrid) {
			const { store, pagination } = <DgridProperties> instance.properties;

			instance.registry = createRegistry(instance.properties);

			instance.own(instance.on('properties:changed', (evt: PropertiesChangeEvent<Dgrid, DgridProperties>) => {
				if (includes(evt.changedPropertyKeys, 'store')) {
					const internalState = internalStateMap.get(instance);

					internalState.store = evt.properties.store;
					internalStateMap.set(instance, internalState);
				}

				if (includes(evt.changedPropertyKeys, 'customCell')) {
					instance.registry = createRegistry(evt.properties);
				}

				// TODO add changed of items per page
			}));

			instance.own(instance.on('state:changed', () => {
				instance.invalidate();
			}));

			if (pagination) {
				internalStateMap.set(instance, {
					store: store.range(0, pagination.itemsPerPage),
					paginationDetails: { dataRangeStart: 0, dataRangeCount: pagination.itemsPerPage, pageNumber: 1 }
				});
			}
			else {
				internalStateMap.set(instance, { store });
			}

		}
	});

export default createDgrid;
