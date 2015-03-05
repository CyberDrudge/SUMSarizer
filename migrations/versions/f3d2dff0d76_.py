"""empty message

Revision ID: f3d2dff0d76
Revises: None
Create Date: 2015-03-04 23:09:35.699808

"""

# revision identifiers, used by Alembic.
revision = 'f3d2dff0d76'
down_revision = None

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('datasets')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.create_table('datasets',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.PrimaryKeyConstraint('id', name=u'datasets_pkey')
    )
    ### end Alembic commands ###
